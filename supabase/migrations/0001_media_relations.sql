create function touch_updated() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create function immutable_record() returns trigger language plpgsql as $$ begin raise exception 'History is append-only'; end $$;
create table contacts (
 id uuid primary key default gen_random_uuid(), code text not null unique, name text not null check(length(trim(name))>0),
 email text not null unique check(email=lower(email) and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 organisation text not null default '', tags text not null default '', status text not null default 'unknown' check(status in ('unknown','active','unsubscribed','hard_bounce','inquiry_only')),
 purpose text not null default '', source text not null default '', review_due date, evidence text not null default '', raw jsonb not null default '{}',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table campaigns (
 id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, owner text not null, objective text not null, audience text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table releases (
 id uuid primary key default gen_random_uuid(), code text not null unique, campaign_id uuid not null references campaigns(id), title text not null, body text not null,
 revision integer not null default 1 check(revision>0), author text not null, embargo_until timestamptz,
 approved_revision integer, approved_by text, approval_evidence text, approved_at timestamptz,
 check(approved_revision is null or (approved_revision=revision and approved_by is not null and lower(approved_by)<>lower(author) and length(trim(approval_evidence))>0 and approved_at is not null)),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table release_versions (
 id uuid primary key default gen_random_uuid(), release_id uuid not null references releases(id), revision integer not null,
 title text not null, body text not null, author text not null, embargo_until timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(release_id,revision)
);
create function version_release() returns trigger language plpgsql as $$ begin
 if TG_OP='INSERT' then
   insert into release_versions(release_id,revision,title,body,author,embargo_until) values(new.id,new.revision,new.title,new.body,new.author,new.embargo_until);
 end if; return new; end $$;
create trigger first_version after insert on releases for each row execute function version_release();
create function guard_release_revision() returns trigger language plpgsql as $$ begin
 if (new.title,new.body,new.author,new.embargo_until) is distinct from (old.title,old.body,old.author,old.embargo_until) then
  new.revision=old.revision+1; new.approved_revision=null; new.approved_by=null; new.approval_evidence=null; new.approved_at=null;
 elsif new.revision<>old.revision then raise exception 'Revision changes require content changes'; end if;
 return new; end $$;
create trigger guard_revision before update on releases for each row execute function guard_release_revision();
create function record_release_revision() returns trigger language plpgsql as $$ begin
 if new.revision<>old.revision then insert into release_versions(release_id,revision,title,body,author,embargo_until) values(new.id,new.revision,new.title,new.body,new.author,new.embargo_until); end if;
 return new; end $$;
create trigger record_revision after update on releases for each row execute function record_release_revision();
create table inquiries (
 id uuid primary key default gen_random_uuid(), code text not null unique, subject text not null, question text not null,
 contact_id uuid not null references contacts(id), campaign_id uuid not null references campaigns(id), release_id uuid references releases(id),
 owner text not null, deadline timestamptz not null, status text not null default 'open' check(status in ('open','pending','closed')),
 outcome text not null default '', closed_at timestamptz, check(status<>'closed' or (length(trim(outcome))>0 and closed_at is not null)),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create function same_campaign() returns trigger language plpgsql as $$ begin
 if new.release_id is not null and not exists(select 1 from releases where id=new.release_id and campaign_id=new.campaign_id) then raise exception 'Release and inquiry must share a campaign'; end if; return new; end $$;
create trigger inquiry_campaign before insert or update on inquiries for each row execute function same_campaign();
create table interactions (
 id uuid primary key default gen_random_uuid(), contact_id uuid not null references contacts(id), happened_at timestamptz not null, note text not null, actor text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table followups (
 id uuid primary key default gen_random_uuid(), code text not null unique, inquiry_id uuid not null references inquiries(id), owner text not null, task text not null, due_at timestamptz not null,
 completed_at timestamptz, outcome text not null default '', check(completed_at is null or length(trim(outcome))>0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table activity (
 id uuid primary key default gen_random_uuid(), actor text not null, action text not null, record_id uuid, detail jsonb not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table import_batches (
 id uuid primary key default gen_random_uuid(), digest text not null unique, filename text not null, original_csv text not null, mapping jsonb not null, row_count integer not null, actor text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
do $$ declare t text; begin
 foreach t in array array['contacts','campaigns','releases','release_versions','inquiries','interactions','followups','activity','import_batches'] loop
 execute format('create trigger updated before update on %I for each row execute function touch_updated()',t);
 execute format('alter table %I enable row level security',t);
 execute format('revoke all on %I from public',t);
 end loop;
 foreach t in array array['release_versions','interactions','activity','import_batches'] loop
 execute format('create trigger immutable before update or delete on %I for each row execute function immutable_record()',t);
 end loop;
end $$;
create view deadline_desk as
 select i.code,i.subject,c.name as contact,c.organisation,i.owner,i.deadline,i.status,
 case when i.deadline<now() then 'overdue' when i.deadline<=now()+interval '24 hours' then 'due today' else 'upcoming' end as attention,
 r.code as release,case when r.id is null then 'no statement linked' when r.approved_revision is null then 'approval needed' when r.embargo_until>now() then 'embargoed' else 'approved draft available' end as statement
 from inquiries i join contacts c on c.id=i.contact_id left join releases r on r.id=i.release_id where i.status<>'closed';
create view release_calendar as
 select r.code,c.name as campaign,r.title,r.revision,r.author,r.embargo_until,r.approved_by,
 case when r.approved_revision is null then 'approval needed' when r.embargo_until>now() then 'embargoed' else 'approved draft available' end as readiness
 from releases r join campaigns c on c.id=r.campaign_id;
create view relationship_review as
 select c.code,c.name,c.organisation,c.status,max(i.happened_at) as last_contact,
 count(distinct q.id) filter(where q.status<>'closed')::int as open_inquiries,
 case when max(i.happened_at) is null then 'no interaction recorded' when max(i.happened_at)<now()-interval '30 days' then 'quiet over 30 days' else 'recent' end as attention
 from contacts c left join interactions i on i.contact_id=c.id left join inquiries q on q.contact_id=c.id group by c.id;
create view compliance_review as
 select code,name,'NZ-IPP9'::text as rule,'Retention review missing or due'::text as finding from contacts where review_due is null or review_due<=current_date
 union all select code,name,'NZ-IPP1','Purpose or source missing' from contacts where trim(purpose)='' or trim(source)=''
 union all select code,name,'CONTACT-REVIEW','Contact status unknown or evidence missing' from contacts where status='unknown' or trim(evidence)='';
create view followup_desk as
 select f.code,i.code as inquiry,f.owner,f.task,f.due_at,f.completed_at,f.outcome,
 case when f.completed_at is not null then 'complete' when f.due_at<now() then 'overdue' else 'open' end as attention
 from followups f join inquiries i on i.id=f.inquiry_id;
revoke all on deadline_desk,release_calendar,relationship_review,compliance_review,followup_desk from public;

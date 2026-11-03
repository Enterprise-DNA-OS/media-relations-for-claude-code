#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getDb, REPO_ROOT} from './lib/db.mjs';
import {parseCsv,pick} from './lib/csv.mjs';
import {table} from './lib/format.mjs';

export const reads = {
 contacts:'select code,name,email,organisation,tags,status,review_due from contacts order by code',
 campaigns:'select code,name,owner,objective,audience from campaigns order by code',
 inquiries:'select code,subject,owner,deadline,status,outcome from inquiries order by deadline,code',
 deadlines:'select * from deadline_desk order by deadline,code',
 releases:'select * from release_calendar order by code',
 'approvals-due':"select * from release_calendar where readiness='approval needed' order by code",
 embargoes:"select * from release_calendar where embargo_until>now() order by embargo_until,code",
 followups:'select * from followup_desk order by due_at,code',
 overdue:"select * from followup_desk where attention='overdue' order by due_at,code",
 'quiet-contacts':"select * from relationship_review where attention<>'recent' order by code",
 compliance:'select * from compliance_review order by code,rule',
 activity:'select actor,action,record_id,detail,created_at from activity order by created_at,id',
 summary:`select c.code,c.name,(select count(*)::int from inquiries i where i.campaign_id=c.id and i.status<>'closed') as open_inquiries,
 (select count(*)::int from inquiries i where i.campaign_id=c.id and i.status<>'closed' and i.deadline<now()) as missed_deadlines,
 (select count(*)::int from releases r where r.campaign_id=c.id and r.approved_revision is null) as approvals_due from campaigns c order by c.code`
};
export const usage = {
 ...Object.fromEntries(Object.keys(reads).map(k=>[k,''])),
 contact:'<code, partial id or name>', inquiry:'<code, partial id or subject>', release:'<code, partial id or title>',
 'add-contact':'--code= --name= --email= --organisation= --actor= [--tags=]',
 'review-contact':'<contact> --purpose= --source= --review-due=YYYY-MM-DD --evidence= --actor=',
 'suppress-contact':'<contact> --status=unsubscribed|hard_bounce|inquiry_only --evidence= --actor=',
 'add-campaign':'--code= --name= --owner= --objective= --audience= --actor=',
 'add-inquiry':'--code= --subject= --question= --contact= --campaign= --owner= --deadline=ISO-offset-time --actor= [--release=]',
 'update-inquiry':'<inquiry> --actor= [--owner=] [--deadline=ISO-offset-time] [--status=open|pending|closed] [--outcome=] [--release=]',
 'add-release':'--code= --campaign= --title= --body= --actor= [--embargo=ISO-offset-time]',
 'revise-release':'<release> --title= --body= --actor= [--embargo=ISO-offset-time|none]',
 'approve-release':'<release> --revision=N --evidence= --actor=',
 'log-contact':'<contact> --note= --happened=ISO-offset-time --actor=',
 'add-followup':'--code= --inquiry= --owner= --task= --due=ISO-offset-time --actor=',
 'close-followup':'<followup> --outcome= --actor=',
 import:'presspage --file=contacts.csv --actor= [--map=mapping.json] [--dry-run]',
 export:'--file=exports/snapshot.json',
 'draft-response':'<inquiry> --actor=', 'draft-release':'<release> --actor=', 'weekly-review':'',help:''
};
const flags = {
 'add-contact':['code','name','email','organisation','tags'], 'review-contact':['purpose','source','review-due','evidence'],
 'suppress-contact':['status','evidence'], 'add-campaign':['code','name','owner','objective','audience'],
 'add-inquiry':['code','subject','question','contact','campaign','owner','deadline','release'], 'update-inquiry':['owner','deadline','status','outcome','release'],
 'add-release':['code','campaign','title','body','embargo'], 'revise-release':['title','body','embargo'], 'approve-release':['revision','evidence'],
 'log-contact':['note','happened'], 'add-followup':['code','inquiry','owner','task','due'], 'close-followup':['outcome'],
 import:['file','map','dry-run'], export:['file']
};
const need=(f,k)=>{if(typeof f[k]!=='string'||!f[k].trim())throw Error(`Required --${k}=value`);return f[k].trim();};
const code=f=>{const x=need(f,'code');if(!/^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$/.test(x))throw Error('Code must be 1-40 letters, digits, underscores or hyphens');return x.toUpperCase();};
const email=v=>{v=v.trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))throw Error('One valid email address is required');return v;};
const day=v=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error('Date must be a real YYYY-MM-DD date');return v;};
const time=v=>{if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/.test(v)||!Number.isFinite(Date.parse(v)))throw Error('Timestamp requires a valid ISO time with Z or an explicit offset');day(v.slice(0,10));return new Date(v).toISOString();};
function args(argv){const pos=[],f={};for(const a of argv){if(a.startsWith('--')){const n=a.indexOf('=');const k=n<0?a.slice(2):a.slice(2,n);if(k in f)throw Error(`Repeated flag --${k}`);f[k]=n<0?true:a.slice(n+1);}else pos.push(a);}return {pos,f};}
const tables={contact:['contacts','name'],campaign:['campaigns','name'],inquiry:['inquiries','subject'],release:['releases','title'],followup:['followups','task']};
export async function resolve(db,type,term,lock=false){if(!term)throw Error(`Specify ${type}`);const [t,n]=tables[type];const all=await db.query(`select * from ${t} order by code`);const q=term.toLowerCase();let hits=all.filter(r=>r.code.toLowerCase()===q||r.id===q);if(!hits.length)hits=all.filter(r=>r.id.startsWith(q)||r[n].toLowerCase().includes(q));if(hits.length!==1)throw Error(`${hits.length?'Ambiguous':'No matching'} ${type}: ${term}\n${(hits.length?hits:all).map(r=>`${r.code}  ${r.id}  ${r[n]}`).join('\n')}`);if(lock)return (await db.query(`select * from ${t} where id=$1 for update`,[hits[0].id]))[0];return hits[0];}
async function event(db,actor,action,row,detail={}){await db.query('insert into activity(actor,action,record_id,detail) values($1,$2,$3,$4::jsonb)',[actor,action,row?.id||null,JSON.stringify(detail)]);}
async function transaction(db,fn){await db.exec('BEGIN');try{const r=await fn();await db.exec('COMMIT');return r;}catch(e){await db.exec('ROLLBACK');throw e;}}
async function insert(db,t,obj){const keys=Object.keys(obj);return (await db.query(`insert into ${t}(${keys.join(',')}) values(${keys.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,Object.values(obj)))[0];}
function writePrivate(file,content){const p=path.resolve(file);fs.mkdirSync(path.dirname(p),{recursive:true,mode:0o700});fs.writeFileSync(p,content,{flag:'wx',mode:0o600});return p;}
function draftFile(name,content){return writePrivate(path.join(process.env.OUTPUT_DIR||REPO_ROOT,'drafts',`${name}-${crypto.randomUUID()}.md`),content);}
export function human(result){const rows=Array.isArray(result)?result:[result];if(!rows.length)return '  (none)';const keys=Object.keys(rows[0]);return table(rows.map(r=>Object.fromEntries(Object.entries(r).map(([k,v])=>[k,v instanceof Date?v.toISOString():typeof v==='object'&&v!==null?JSON.stringify(v):v]))),keys.map(k=>({key:k,label:k.replaceAll('_',' '),width:70})));}

const aliases={email:['Email','Email address','Email Address','email_address'],name:['Name','Full name','Full Name'],first:['First name','First Name','first_name'],last:['Last name','Last Name','last_name'],organisation:['Organisation','Organization','Company','Outlet'],tags:['Tags','Lists','List'],status:['Status','Contact status'],external_id:['ID','Contact ID','Id']};
export async function importContacts(db,f,actor){
 const file=path.resolve(need(f,'file'));const csv=fs.readFileSync(file,'utf8');const rows=parseCsv(csv);if(!rows.length)throw Error('Empty contact export');
 const mapping=f.map?JSON.parse(fs.readFileSync(f.map,'utf8')):{};
 for(const [k,v] of Object.entries(mapping))if(!(k in aliases)||typeof v!=='string'||!Object.hasOwn(rows[0],v))throw Error(`Invalid mapping ${k}; map supported fields to exact source headers`);
 const val=(r,k)=>mapping[k]?r[mapping[k]]:pick(r,...aliases[k]);
 const digest=crypto.createHash('sha256').update(csv).update(JSON.stringify(mapping)).digest('hex');
 const seen=new Set();const contacts=rows.map((r,i)=>{const e=email(val(r,'email'));if(seen.has(e))throw Error(`Duplicate email at row ${i+2}`);seen.add(e);
  const name=val(r,'name').trim()||[val(r,'first'),val(r,'last')].filter(Boolean).join(' ').trim();if(!name)throw Error(`Row ${i+2}: missing name`);
  const s=val(r,'status').trim().toLowerCase().replace(/[_-]/g,' ');const status={'':'unknown','active':'unknown','subscribed':'unknown','unknown':'unknown','unsubscribed':'unsubscribed','hard bounce':'hard_bounce','hard bounced':'hard_bounce','inquiry only':'inquiry_only'}[s];
  if(!status)throw Error(`Row ${i+2}: unrecognised status '${s}', map or correct it before importing`);
  return {code:'IMP-'+crypto.createHash('sha256').update(e).digest('hex').slice(0,16).toUpperCase(),name,email:e,organisation:val(r,'organisation').trim(),tags:val(r,'tags'),status,source:'Presspage contact export',raw:r};});
 return transaction(db,async()=>{
  if((await db.query('select id from import_batches where digest=$1',[digest])).length)return {rows:rows.length,inserted:0,unchanged:rows.length,repeat:true,dry_run:Boolean(f['dry-run'])};
  let inserted=0,unchanged=0;
  for(const c of contacts){const exists=(await db.query('select * from contacts where email=$1 for update',[c.email]))[0];
   if(exists){if(JSON.stringify(exists.raw)!==JSON.stringify(c.raw)){
     // JSONB key order differs; compare sorted source entries instead.
     const stable=o=>JSON.stringify(Object.entries(o).sort(([a],[b])=>a.localeCompare(b)));
     if(stable(exists.raw)!==stable(c.raw))throw Error(`Existing contact ${c.email} has different source fields; reconcile explicitly. No contacts imported.`);
    }unchanged++;continue;}
   inserted++;if(!f['dry-run'])await insert(db,'contacts',{...c,raw:JSON.stringify(c.raw)});
  }
  if(!f['dry-run']){const batch=await insert(db,'import_batches',{digest,filename:path.basename(file),original_csv:csv,mapping:JSON.stringify(mapping),row_count:rows.length,actor});await event(db,actor,'import',batch,{inserted,unchanged});}
  return {rows:rows.length,inserted,unchanged,repeat:false,dry_run:Boolean(f['dry-run'])};
 });
}

export async function run(db,argv){
 const {pos,f}=args(argv);const cmd=pos.shift()||'help';if(!(cmd in usage))throw Error(`Unknown command: ${cmd}`);
 for(const k of Object.keys(f))if(!['json','actor',...(flags[cmd]||[])].includes(k))throw Error(`Unknown flag --${k} for ${cmd}`);
 for(const k of ['json','dry-run'])if(k in f&&f[k]!==true)throw Error(`--${k} takes no value`);
 const takesPos=['contact','inquiry','release','review-contact','suppress-contact','update-inquiry','revise-release','approve-release','log-contact','close-followup','draft-response','draft-release','import'].includes(cmd);
 if(pos.length!==(takesPos?1:0))throw Error(`Usage: ${cmd} ${usage[cmd]}`);
 if(cmd==='help')return Object.entries(usage).map(([command,arguments_])=>({command,arguments:arguments_}));
 if(reads[cmd])return db.query(reads[cmd]);
 if(['contact','inquiry','release'].includes(cmd)){
  const row=await resolve(db,cmd,pos[0]);
  if(cmd==='contact')return {...row,interactions:await db.query('select * from interactions where contact_id=$1 order by happened_at',[row.id])};
  if(cmd==='inquiry')return {...row,followups:await db.query('select * from followups where inquiry_id=$1 order by due_at',[row.id])};
  return {...row,versions:await db.query('select * from release_versions where release_id=$1 order by revision',[row.id])};
 }
 if(cmd==='export')return transaction(db,async()=>{await db.exec('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY');const data={format:'media-relations-snapshot-v1',exported_at:new Date().toISOString()};for(const t of ['contacts','campaigns','releases','release_versions','inquiries','interactions','followups','activity','import_batches'])data[t]=await db.query(`select * from ${t} order by id`);return {file:writePrivate(need(f,'file'),JSON.stringify(data,null,2)+'\n'),records:Object.values(data).filter(Array.isArray).reduce((n,a)=>n+a.length,0)};});
 if(cmd==='weekly-review'){return transaction(db,async()=>{await db.exec('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY');let content='# Monday media desk review\n\nInternal draft. Nothing has been sent.\n';for(const key of ['deadlines','approvals-due','overdue'])content+=`\n## ${key}\n\n\`\`\`text\n${human(await db.query(reads[key]))}\n\`\`\`\n`;return {file:draftFile('weekly-review',content),reports:3};});}
 const actor=need(f,'actor');
 if(cmd==='import'){if(pos[0]!=='presspage')throw Error('Only import presspage is supported');return importContacts(db,f,actor);}
 return transaction(db,async()=>{
  let row;
  if(cmd==='add-contact')row=await insert(db,'contacts',{code:code(f),name:need(f,'name'),email:email(need(f,'email')),organisation:need(f,'organisation'),tags:f.tags||''});
  else if(cmd==='review-contact'){const c=await resolve(db,'contact',pos[0],true);const due=day(need(f,'review-due'));if(due<=new Date().toISOString().slice(0,10))throw Error('Next review must be a future date');row=(await db.query(`update contacts set purpose=$2,source=$3,review_due=$4,evidence=$5,status=case when status='unknown' then 'active' else status end where id=$1 returning *`,[c.id,need(f,'purpose'),need(f,'source'),due,need(f,'evidence')]))[0];}
  else if(cmd==='suppress-contact'){const c=await resolve(db,'contact',pos[0],true);const s=need(f,'status');if(!['unsubscribed','hard_bounce','inquiry_only'].includes(s))throw Error('Use a suppression status; this command cannot reactivate a contact');row=(await db.query('update contacts set status=$2,evidence=$3 where id=$1 returning *',[c.id,s,need(f,'evidence')]))[0];}
  else if(cmd==='add-campaign')row=await insert(db,'campaigns',{code:code(f),name:need(f,'name'),owner:need(f,'owner'),objective:need(f,'objective'),audience:need(f,'audience')});
  else if(cmd==='add-release'){const c=await resolve(db,'campaign',need(f,'campaign'));row=await insert(db,'releases',{code:code(f),campaign_id:c.id,title:need(f,'title'),body:need(f,'body'),author:actor,embargo_until:f.embargo?time(f.embargo):null});}
  else if(cmd==='revise-release'){const r=await resolve(db,'release',pos[0],true);row=(await db.query('update releases set title=$2,body=$3,author=$4,embargo_until=$5 where id=$1 returning *',[r.id,need(f,'title'),need(f,'body'),actor,f.embargo===undefined?r.embargo_until:f.embargo==='none'?null:time(f.embargo)]))[0];}
  else if(cmd==='approve-release'){const r=await resolve(db,'release',pos[0],true);if(!/^\d+$/.test(need(f,'revision'))||Number(f.revision)!==r.revision)throw Error('Approval must name the current revision');if(actor.toLowerCase()===r.author.toLowerCase())throw Error('A different reviewer must approve this revision');row=(await db.query('update releases set approved_revision=revision,approved_by=$2,approval_evidence=$3,approved_at=now() where id=$1 returning *',[r.id,actor,need(f,'evidence')]))[0];}
  else if(cmd==='add-inquiry'){const c=await resolve(db,'contact',need(f,'contact'));const campaign=await resolve(db,'campaign',need(f,'campaign'));const release=f.release?await resolve(db,'release',f.release):null;row=await insert(db,'inquiries',{code:code(f),subject:need(f,'subject'),question:need(f,'question'),contact_id:c.id,campaign_id:campaign.id,release_id:release?.id||null,owner:need(f,'owner'),deadline:time(need(f,'deadline'))});}
  else if(cmd==='update-inquiry'){const q=await resolve(db,'inquiry',pos[0],true);if(!['owner','deadline','status','outcome','release'].some(k=>k in f))throw Error('No inquiry changes supplied');const s=f.status||q.status;if(!['open','pending','closed'].includes(s))throw Error('Invalid inquiry status');const outcome=f.outcome??q.outcome;const release=f.release?await resolve(db,'release',f.release):null;if(s==='closed'&&(await db.query('select id from followups where inquiry_id=$1 and completed_at is null',[q.id])).length)throw Error('Close outstanding follow-ups before closing the inquiry');if(s==='closed'&&!outcome.trim())throw Error('Closing requires an outcome');row=(await db.query('update inquiries set owner=$2,deadline=$3,status=$4,outcome=$5,closed_at=$6,release_id=$7 where id=$1 returning *',[q.id,f.owner?need(f,'owner'):q.owner,f.deadline?time(f.deadline):q.deadline,s,outcome,s==='closed'?(q.closed_at||new Date().toISOString()):null,release?.id||q.release_id]))[0];}
  else if(cmd==='log-contact'){const c=await resolve(db,'contact',pos[0]);const happened=time(need(f,'happened'));if(Date.parse(happened)>Date.now())throw Error('Interaction cannot be in the future');row=await insert(db,'interactions',{contact_id:c.id,happened_at:happened,note:need(f,'note'),actor});}
  else if(cmd==='add-followup'){const i=await resolve(db,'inquiry',need(f,'inquiry'),true);if(i.status==='closed')throw Error('Cannot add follow-up to a closed inquiry');row=await insert(db,'followups',{code:code(f),inquiry_id:i.id,owner:need(f,'owner'),task:need(f,'task'),due_at:time(need(f,'due'))});}
  else if(cmd==='close-followup'){const x=await resolve(db,'followup',pos[0],true);if(x.completed_at)throw Error('Follow-up is already complete');row=(await db.query('update followups set completed_at=now(),outcome=$2 where id=$1 returning *',[x.id,need(f,'outcome')]))[0];}
  else if(cmd==='draft-release'||cmd==='draft-response'){
   let r,q,c;
   if(cmd==='draft-response'){q=await resolve(db,'inquiry',pos[0],true);if(q.status==='closed')throw Error('Inquiry is closed');c=(await db.query('select * from contacts where id=$1 for update',[q.contact_id]))[0];if(!['active','inquiry_only'].includes(c.status))throw Error('Contact is suppressed or unreviewed');if(!c.review_due||c.review_due<=new Date().toISOString().slice(0,10)||!c.purpose||!c.source||!c.evidence)throw Error('Contact needs a current purpose and retention review');if(!q.release_id)throw Error('Link a checked statement before drafting');r=(await db.query('select * from releases where id=$1 for update',[q.release_id]))[0];}
   else r=await resolve(db,'release',pos[0],true);
   if(r.approved_revision!==r.revision)throw Error('Current release revision needs approval');if(r.embargo_until&&new Date(r.embargo_until)>new Date())throw Error('Embargo is still active; draft blocked');
   const content=`# INTERNAL DRAFT: ${q?q.subject:r.title}\n\nNot sent or published. A person must review the exact wording and recipient before use.\n\n${c?`To: ${c.name} <${c.email}>\nInquiry: ${q.code}\nQuestion: ${q.question}\n\n`:''}Statement: ${r.code}, revision ${r.revision}\nApproved by: ${r.approved_by}\nEvidence: ${r.approval_evidence}\n\n${r.body}\n`;
   // Commit the audit before writing the file would risk an audit for a missing file.
   // A failure to commit leaves an internal draft only; it never sends anything.
   const file=draftFile(q?q.code:r.code,content);row={id:q?.id||r.id,file,revision:r.revision};
  }
  else throw Error(`Unimplemented command ${cmd}`);
  await event(db,actor,cmd,row,{code:row.code||null,revision:row.revision||null,...(row.file?{file:row.file}:{}),...(f.evidence?{evidence:f.evidence}:{})});return row;
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){let db;try{db=await getDb();const result=await run(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(result,null,2):human(result));}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}}

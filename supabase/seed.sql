insert into contacts(id,code,name,email,organisation,tags,status,purpose,source,review_due,evidence) values
('10000000-0000-4000-8000-000000000001','C-001','Alex Rivers','alex@example.test','Harbour Business','business,regional','active','Respond to incoming media requests','Demo inbound request',current_date+90,'Demo request reference'),
('10000000-0000-4000-8000-000000000002','C-002','Alex Chen','chen@example.test','Southern News','transport','unknown','','',null,''),
('10000000-0000-4000-8000-000000000003','C-003','Morgan Lake','morgan@example.test','Coast Radio','radio','unsubscribed','Maintain suppression record','Demo opt-out',current_date-1,'Demo opt-out request') on conflict do nothing;
insert into campaigns(id,code,name,owner,objective,audience) values
('20000000-0000-4000-8000-000000000001','CAM-001','Harbour opening','Jamie','Answer launch questions with checked opening details','Regional business journalists'),
('20000000-0000-4000-8000-000000000002','CAM-002','Winter service update','Taylor','Explain the new timetable','Transport correspondents') on conflict do nothing;
insert into releases(id,code,campaign_id,title,body,author,embargo_until,approved_revision,approved_by,approval_evidence,approved_at) values
('30000000-0000-4000-8000-000000000001','REL-001','20000000-0000-4000-8000-000000000001','Opening statement','The Harbour demonstration office opens next week. This is invented demo text.','Jamie',now()+interval '2 days',1,'Taylor','DEMO-APPROVAL-1',now()),
('30000000-0000-4000-8000-000000000002','REL-002','20000000-0000-4000-8000-000000000001','Opening questions','Opening hours are awaiting confirmation. Invented demo text.','Jamie',null,null,null,null,null),
('30000000-0000-4000-8000-000000000003','REL-003','20000000-0000-4000-8000-000000000002','Service statement','The demonstration timetable is unchanged this week. Invented demo text.','Taylor',null,1,'Jamie','DEMO-APPROVAL-3',now()) on conflict do nothing;
insert into inquiries(id,code,subject,question,contact_id,campaign_id,release_id,owner,deadline) values
('40000000-0000-4000-8000-000000000001','INQ-001','Opening interview','Can you confirm the spokesperson?','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','Jamie',now()-interval '4 hours'),
('40000000-0000-4000-8000-000000000002','INQ-002','Opening hours','Which hours can we print?','10000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000002','Taylor',now()+interval '3 hours'),
('40000000-0000-4000-8000-000000000003','INQ-003','Timetable check','Is the service changing?','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000003','Taylor',now()+interval '3 days') on conflict do nothing;
insert into interactions(id,contact_id,happened_at,note,actor) values
('50000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',now()-interval '45 days','Demo call about the opening','Jamie') on conflict do nothing;
insert into followups(id,code,inquiry_id,owner,task,due_at) values
('60000000-0000-4000-8000-000000000001','F-001','40000000-0000-4000-8000-000000000001','Jamie','Confirm the spokesperson before replying',now()-interval '2 hours'),
('60000000-0000-4000-8000-000000000002','F-002','40000000-0000-4000-8000-000000000002','Taylor','Get opening hours approved',now()+interval '1 hour') on conflict do nothing;

# Media Relations for Claude Code

For communications teams managing their owned press relationships, inbound enquiries and statement approvals. Confirm the intended business and operator before using real records.

## Rules

Start every answer from the CLI. Read the relevant record before changing it. All dates and day boundaries use UTC. Timestamp inputs require Z or an explicit time-zone offset.

Never send email, post, publish, crawl a media database or change a public newsroom. Drafts stay in drafts/. Do not bypass approval, embargo or suppression checks. A current approval is evidence for drafting, never authority to publish. The operator supplies a separate reviewer's evidence. Actor names are labels, not authentication.

Use a trusted local operator and an owner database connection. No shared login, tenant isolation or online service is provided. Keep personal data, imports, exports, reports and secrets out of git. Never seed a live working database. Review retention findings; do not delete automatically.

## One route per job

| Command | Purpose |
|---|---|
| /contacts | Read owned press contacts and their review status. |
| /campaigns | Read campaign objectives, audiences and owners. |
| /inquiries | Read all media enquiries, including closed ones. |
| /deadlines | Triage response deadlines alongside statement readiness. |
| /releases | Read release revisions, reviewers and embargoes. |
| /approvals-due | Find statements whose current wording needs approval. |
| /embargoes | Check statements still under embargo. |
| /followups | Read the follow-up ledger. |
| /overdue | Find overdue follow-ups and their owners. |
| /quiet-contacts | Find relationships with no recorded contact in thirty days. |
| /compliance | Check purpose, retention review and contact status evidence. |
| /activity | Read the recorded actor and action history. |
| /summary | Compare campaign workload and missed deadlines. |
| /contact | Read one contact and their interaction history. |
| /inquiry | Read one enquiry and its follow-up work. |
| /release | Read one release and all its versions. |
| /add-contact | Record an owned contact as unreviewed. |
| /review-contact | Record the purpose, source, evidence and next review date. |
| /suppress-contact | Record an opt-out, hard bounce or inquiry-only restriction. |
| /add-campaign | Define the objective, audience and owner. |
| /add-inquiry | Record an incoming question and its response deadline. |
| /update-inquiry | Assign, reschedule, link a statement or close an enquiry. |
| /add-release | Create the first version of a statement. |
| /revise-release | Save new wording and invalidate the old approval. |
| /approve-release | Record a different reviewer approving the current revision. |
| /log-contact | Record an interaction that actually happened. |
| /add-followup | Assign a task against an open enquiry. |
| /close-followup | Record the completed task and outcome. |
| /import | Validate and import an owned Presspage contact export. |
| /export | Write a complete private JSON snapshot to a new file. |
| /draft-response | Draft a response from a reviewed, approved, unembargoed statement. |
| /draft-release | Draft an approved, unembargoed release without publishing. |
| /weekly-review | Draft Monday review from deadlines, approvals and overdue follow-ups. |
| /help | List every command and its arguments. |
| /customise | Add a field or rule with a tested migration. |
| /new-view | Add a branded read-only report. |

Run npm run media -- help for arguments. Names match case-insensitively; codes or unique id prefixes are safer. Ambiguous matches list candidates and exit 1.

## Files

scripts/media.mjs is the CLI. supabase/migrations holds migrations. DATABASE_URL selects PostgreSQL; otherwise DATA_DIR selects PGlite under .data/db. brand.json sets the business name, logo and colours. views.json and documents.json define reports. Read docs/replace-presspage.md before importing and docs/compliance.md before interpreting record checks.

Run npm test after changes. Add a new migration for an existing installation. Use a temporary database for experiments. Back up before applying changes.

Built and run through Omni by Enterprise DNA. https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=presspage

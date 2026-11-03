# Media Relations for Claude Code

Own the press desk: journalist enquiries, response deadlines, statement versions, approvals and embargoes in one database.

## Three ways to own it

- **Do it yourself:** use this MIT-licensed base with Claude Code, Codex, OpenCode or Cursor. Hosting and your agent subscription are separate costs.
- **We customise it:** Enterprise DNA maps your Presspage contacts, brings across the agreed history, changes fields and rules, and builds connections, a web front end or a different stack when needed. One setup fee, then a retainer for ongoing work.
- **We run it for you:** Omni by Enterprise DNA installs it, manages access and backups, prepares reviews and maintains your version. One setup fee, then a retainer.

[Book a 30-minute call with Sam](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=presspage).

## Run the synthetic demo

Node 20 or newer. No cloud account is required.

```sh
npm install
npm test
npm run demo
npm run media -- deadlines
npm run media -- approvals-due --json
npm run view
npm run docs
```

The invented demo includes a missed response deadline, an embargoed statement, wording waiting for approval, an overdue task, a stale relationship and incomplete contact evidence. Repeated seeding preserves existing records. Use a fresh DATA_DIR for real work and never seed it. Set DATABASE_URL for PostgreSQL or leave it empty for local PGlite.

## What the base does

Nine domain record types hold owned contacts, campaigns, releases, immutable release versions, enquiries, interactions, follow-ups, activity and original imports. Five views drive the weekly desk review. A draft can use a statement only after a different reviewer has approved its current revision and its embargo has ended. Edits to wording, author or embargo invalidate approval and preserve a new version. Response drafts additionally require a reviewed contact with a current retention review; opted-out and bounced contacts are blocked. Inquiry-only contacts can receive an internal response draft for their incoming request. Nothing sends.

Do not equate an active contact with marketing consent. Review-contact records purpose and retention evidence; it never clears an opt-out. No reactivation shortcut is provided. A record correction needs a reviewed migration and evidence. Closing an enquiry requires an outcome and completed follow-ups. Interactions cannot be future-dated. All timestamps are interpreted as UTC instants.

This is an independent implementation of the owned-records work. Presspage also sells publishing, email distribution, media discovery and other connected services. This base has no licensed journalist database, public newsroom, mailbox ingestion, email sending, tracking pixels, investor disclosure feed or media monitoring. Scope any such connection separately. The CLI reads the local desk records; it does not reproduce unavailable vendor analytics.

## Recurring jobs

| Command | What it does |
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
| /customise | Add a field, rename a status or change a rule with a tested migration. |
| /new-view | Add a branded read-only report from your records. |

All 34 CLI commands support --json. Flags use --name=value. The two agent recipes bring the total to 36 slash commands.

## Ten questions your own records answer

1. Which response deadlines have passed while the linked statement is still embargoed? (`deadlines`)
2. Which enquiries need an answer today but have no approved wording? (`deadlines`)
3. Which current statement versions are waiting for a reviewer? (`approvals-due`)
4. Which approved statements are still under embargo? (`embargoes`)
5. Which follow-ups are overdue, and who owns them? (`overdue`)
6. Which journalists have open enquiries but no recent logged interaction? (`quiet-contacts`)
7. Which contacts have no recorded source or purpose? (`compliance`)
8. Which contacts need a retention review? (`compliance`)
9. Which campaigns have both missed deadlines and unapproved statements? (`summary`)
10. What changed between statement versions, and who approved the current one? (`release REL-001`)

These are implemented queries, not an unsupported claim that Presspage cannot answer them. Joining your history and changing your own rules is the reason to own the system.

## Your first hour: ten things to ask for

1. Put our name, colours and logo in brand.json.
2. Show overdue journalist questions and their owners.
3. Show wording that needs approval before an answer can be drafted.
4. Show approved statements whose embargo has not ended.
5. Read the version history for one statement.
6. Draft the Monday review from the three desk reports.
7. Test our contact export and reconcile its counts.
8. Show contacts missing a purpose or retention review.
9. Add our spokesperson field with a tested migration.
10. Export a private snapshot before changing a rule.

## Switch from Presspage

[The replace guide](docs/replace-presspage.md) covers the vendor's documented Contacts export, supported headers and explicit mappings. One command imports the owned-contact CSV after a test run. Original columns and the original file stay in the database. Exact repeat imports are harmless; conflicting existing contacts cause the entire import to roll back. The fixture is synthetic. Validate a real export before switching. Conversations, releases, attachments and metrics are a separate migration job.

## Reports and documents

Edit brand.json, then npm run view produces the week, release calendar and relationship review. npm run docs produces spokesperson briefs, release approval records and campaign reviews. These are private HTML documents that print to PDF. They contain internal working records; share only after checking recipients and rights. Statement bodies are withheld from general documents and emitted only by the checked draft commands. The detail CLI and complete snapshots still expose bodies to the trusted operator.

[Why no front end](docs/why-no-front-end.md) covers mobile, collaboration and publishing limits. [Compliance](docs/compliance.md) explains the sourced checks and their boundaries. [Research](docs/research.md) records pricing, target scores and buyer evidence limits.

## Validation and deployment

npm test uses temporary storage, exercises every CLI command and tests atomic import rollback, duplicate handling, malformed files, UTC dates, approval invalidation, embargoes, suppression, complete snapshots and escaped HTML. CI is configured for Windows and Ubuntu on Node 20 and 22, plus PostgreSQL 16. Run results are reported separately; configuration alone is not a passing run. TEST_DATABASE_URL must be an empty disposable database and is used only by tests.

Every domain table has row-level security enabled and PUBLIC privileges removed. This is an owner-operated tool, with no application authentication or multi-tenant deployment. Actor names and reviewer labels are not verified identities. Database owners can bypass controls. Protect the host, database, backups and generated files; select your retention policy with your organisation. Export writes a new JSON snapshot including original CSVs and version history. Use native database backups too; automatic snapshot restore is not provided.

## Licence

MIT. Copyright 2026 Enterprise DNA. Presspage belongs to its owner. No vendor code, licensed journalist data or assets are included.

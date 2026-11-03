# Replace the owned Presspage media desk

## Export from Presspage

In Contacts, select the records you own and use Export. Presspage documents CSV export on the [Contacts page](https://help.presspage.com/hc/en-us/articles/360009928559-Contacts) and for [contact lists](https://help.presspage.com/hc/en-us/articles/360003470232-Contact-Lists). Export the full intended selection, not only the first page. Keep the file private. Do not export or redistribute licensed discovery data without the right to use it.

The vendor documents the CSV action but does not publish a fixed export contract in these articles. This adapter accepts documented contact concepts through common English header aliases and explicit mapping. The fixture is invented, not a captured customer export. A real-file dry run and reconciliation are required.

## One import command

Use a fresh working database, migrate it and do not seed it. Set DATA_DIR to its private local folder or DATABASE_URL to the intended PostgreSQL database in your environment.

```sh
npm run migrate
npm run media -- import presspage --file=imports/contacts.csv --actor=Operator --dry-run
npm run media -- import presspage --file=imports/contacts.csv --actor=Operator
npm run media -- contacts --json
npm run media -- compliance
```

Use the same command without --dry-run only after its counts and mapping are right. Dry run parses all rows and checks existing contacts without changing anything. JSON output reports rows, inserted, unchanged and whether this was an exact repeat.

## What maps

| Owned record | Accepted English headers |
|---|---|
| Email, required | Email, Email address, email_address |
| Name, required | Name, Full name; or First name plus Last name |
| Organisation | Organisation, Organization, Company, Outlet |
| Segmentation text | Tags, Lists, List |
| Contact restriction | Status, Contact status |

Case differences in headers are accepted. Use one valid email per row. Email is normalised to lowercase and is the matching key. Duplicate emails in a file are rejected. Names do not identify contacts. Tags and lists remain their original text; all extra columns remain in raw. Exported ids stay in raw, while local codes derive deterministically from email. Changing an email requires explicit reconciliation.

Missing, active and subscribed source statuses become unknown locally. Unsubscribed, hard bounce and inquiry only remain restrictions. Unknown status spellings fail the whole file. Imported source status is never treated as consent. A local purpose, evidence and future retention-review date must be recorded before response drafting. A review does not clear suppression.

If headers differ, save a private mapping file such as:

```json
{"email":"E-mail","name":"Display name","organisation":"Publication","status":"Contact state"}
```

Then add --map=imports/mapping.json. Keys allowed are email, name, first, last, organisation, tags, status and external_id; values must name exact source headers. External ids are retained in raw and do not replace email matching. This adapter reads UTF-8 CSV with BOM, CRLF, quoted commas and embedded newlines. It rejects empty or repeated headers, malformed rows and missing identity fields. Convert a non-CSV export to UTF-8 CSV while preserving every row and column.

## What does not carry over

Contact CSVs do not bring enquiry conversations, release bodies, newsroom pages, attachments, approvals, delivery history, subscriptions as permissions, licensed media records, tracking events or investor disclosures. The CLI records new enquiries and statements. Existing non-contact history needs a separately reviewed mapping and migration. Copying a subscription label never establishes permission to send.

Identical imports are no-ops. Changed source fields for an existing email are rejected atomically, including inserts earlier in the same file. No live contact edits or suppression flags are overwritten. The original file, filename, mapping, fingerprint, row count and importing actor remain in import_batches. Access and retention controls must cover this original data and exports too.

## Reconcile before switching

Compare total rows, unique emails, names, organisation labels, segmentation and restricted-contact counts. Inspect representative raw fields. Re-run the same file to verify no duplicates. Test a real enquiry from creation through approval, embargo expiry and an internal draft. Keep the old system until the agreed records and services work in your version. A one-command contact import is not a promise that every connected Presspage service moves in one day.

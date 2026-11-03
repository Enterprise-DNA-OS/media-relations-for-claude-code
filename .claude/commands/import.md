---
description: Validate and import an owned Presspage contact export.
---

Read CLAUDE.md first. Validate and import an owned Presspage contact export.

Run `npm run media -- import presspage --file=contacts.csv --actor= [--map=mapping.json] [--dry-run]`. Replace placeholders with the operator's actual values, quote arguments containing spaces, and omit unused optional flags. All commands accept `--json`. Run help if an argument is unclear. Never copy the square-bracket notation into a shell.

Read the relevant contact, enquiry or release before changing it. Use the recorded operator as actor. An actor label is not authentication.

Read docs/replace-presspage.md. Use --dry-run first, compare counts and review every suppressed or unknown contact. Keep the original export private. A contact export does not contain enquiry conversations, statements or newsroom assets.

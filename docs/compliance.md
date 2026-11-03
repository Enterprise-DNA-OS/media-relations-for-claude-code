# Record checks for the press desk

Sources checked 2026-11-03. These checks find missing evidence and work requiring review. They do not certify compliance or determine which laws apply to a particular organisation.

| Check | Source and purpose | Implemented behaviour |
|---|---|---|
| NZ-IPP1 | [NZ Privacy Commissioner, Principle 1](https://www.privacy.org.nz/privacy-principles/1/): collect necessary information for a lawful organisational purpose. | Flags contacts without a recorded purpose or source. These fields record an operator's decision; their presence does not prove lawfulness. |
| NZ-IPP9 | [NZ Privacy Commissioner, Principle 9](https://www.privacy.org.nz/privacy-principles/9/): retain personal information only while needed for a lawful use. | Flags missing or due retention-review dates. No universal retention period is assumed. The operator chooses the date and reviews the whole record, original imports and backups. Nothing is deleted automatically. |
| CONTACT-REVIEW | Local operating policy, informed by [Presspage contact restrictions](https://help.presspage.com/hc/en-us/articles/360009928559-Contacts). This is not a statutory test. | Flags unknown statuses or missing evidence. Imported subscription labels never become consent. Opt-outs and hard bounces block response drafts. Inquiry-only allows a reviewed internal reply draft to the incoming enquiry. |
| Current revision approval | Local editorial policy. | A different reviewer and evidence must approve the exact revision. Any title, body, author or embargo change invalidates approval. History remains append-only. |
| Embargo | The date and time agreed by the business, not a statutory default. | Draft output is blocked until the embargo ends. Explicit time-zone offsets prevent ambiguous dates. A passing check does not permit publication. |

For Australian organisations subject to the Privacy Act, [OAIC APP 11 guidance](https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-11-app-11-security-of-personal-information) covers protecting held information and destroying or de-identifying it when no longer needed, subject to exceptions. This base provides review records and private file permissions, not a complete APP assessment or automatic disposal system. The NZ-labelled review flags are prompts to configure the applicable local policy.

Access is limited by the host and database account. RLS is enabled with no public policies, and PUBLIC database privileges are revoked. Use a trusted owner connection; there is no shared login or tenant separation. Actor and approver names are not identity verification. Source history and audit rows are append-only for ordinary application operations; a database owner can change them. Keep evidence documents in your controlled document store and record their references here.

No email, newsroom publishing, investor disclosure, legal notice service or paid distribution is implemented. Handling an inbound media enquiry does not establish permission for an unsolicited campaign. The full legal and editorial review of a proposed communication remains outside these record checks.

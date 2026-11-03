# A desk you run by asking

The recurring work is a set of questions and decisions: what needs an answer, who owns it, which wording is approved, and when an embargo ends. Commands read the database and record those decisions. Branded HTML reports provide a read-only view of the same records.

A screen gives simultaneous editing, mobile navigation, a visual story editor, drag-and-drop assets and permission controls for many users. This base provides none of those interfaces. A local database is intended for one operator process at a time; shared PostgreSQL needs a deployment and access design. There is no offline mobile app, shared newsroom, live inbox, automated media monitoring or distribution network.

Enterprise DNA scopes the screens and connections a team needs as part of its version. A licensed media directory remains a licensed source. Existing Presspage feeds and public publishing stay in place until their replacements are independently tested and approved.

Use brand.json for the business name, colours and optional logo. npm run view creates the week, releases and relationships reports; npm run docs creates internal spokesperson briefs, approval records and campaign reviews. Nothing hosts them or creates public links. Print to PDF when needed and check the recipient before sharing.

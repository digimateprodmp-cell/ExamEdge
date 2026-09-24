# Ambiguous / Unmapped Tables

Per the instruction not to guess a table's purpose from its name alone, every table below was inspected via its actual `CREATE TABLE` definition and real sample rows (not assumed). These are the ones where that inspection still leaves a genuine open question — each needs either a product decision, the original Laravel source for reference, or more data (in the case of empty tables) before it can be mapped.

## Empty tables (no data to infer purpose from)

| Table | Notes |
|---|---|
| `purchasesets` | 0 rows. Name suggests a purchase-tracking table for some "set" product, but no such product is otherwise identifiable in the schema. **Recommendation: exclude from migration entirely; there is nothing to migrate.** |
| `couponenrolls` | 0 rows. Likely a coupon-granted (non-paid) access record, parallel to `couponusages`. Cannot confirm the exact distinction with no data. |
| `failed_jobs`, `password_resets`, `youtubetokens` | 0 rows, and these are Laravel/infra-internal tables in any case — out of scope regardless of row count. |

## Ambiguous enum/flag values (no lookup table exists in the DB)

| Table.Column | Sample value(s) seen | Why it's ambiguous |
|---|---|---|
| `coupons.ccFor` | `6` | Unlabelled integer. Almost certainly maps to a product-type constant in the original Laravel code (`CourseController`, `TestSeriesController`, etc. likely each register a numeric constant) — that source is outside this SQL dump and needs to be consulted, or the product owner needs to supply the mapping. |
| `coupons.ccType` | `0` | Same issue — likely `0 = percent, 1 = fixed` or the reverse; guessing wrong would silently corrupt discount amounts on migrated coupons. |
| `couponusages.productId` | integer, no `productType` column | The same ID range is reused across course/test-series/batch/etc — which table it points into isn't recoverable from the row alone. The sample's `usedFor='Live Class'` free-text column is a hint but isn't guaranteed present/reliable on every row. |
| `users.type` | `'User'`, `'Admin'`, `'QA'` (partial scan) | `QA` has no equivalent in our two-value `Role` enum (`STUDENT`/`ADMIN`). Needs a decision: treat as `ADMIN`, extend the `Role` enum, or exclude these accounts from migration pending manual handling. |
| `users.status` | `1`, `3` (partial scan) | `3`'s meaning (suspended? banned? unverified?) is unconfirmed. |
| `questions.qStatus` / `tests.tStatus` / `testseries.tsStatus` / `courses.courseStatus` | Each is an independent `tinyint` with no shared meaning across tables — `testseries.tsStatus=0` appeared on a sample row containing real, apparently-live content, which is the opposite of what "0 = draft" would suggest for a `Boolean`-like `isPublished` mapping. **Do not assume `0`/`1` means the same thing as our own `isPublished` boolean without checking a larger sample per table.** |
| `batchenrolls.enrollType` | `0` | Unlabelled — likely distinguishes free/paid/admin-granted enrollment, mirroring our own `EnrollmentSource` enum, but the exact value-to-meaning mapping needs confirmation before it can drive that mapping automatically. |

## Structurally ambiguous relationships

| Relationship | The ambiguity |
|---|---|
| `questions.sqtId` → `questiontags.qtId` | Assumed to be a *child* tag of `questions.qtId` (i.e. `questiontags[sqtId].parentQtId == qtId`), but nothing enforces this. Must be validated with the SQL query in `QUESTION_MIGRATION_PLAN.md` §3 before the Subject/Topic/SubTopic mapping can be trusted. |
| `results.attempts` vs `tests.attempts` | Both fields exist, both are plausibly "number of attempts," and a sample pair (`tests.attempts=20`, a `results.attempts=10` row against that same test) doesn't clarify which is "max allowed" vs "this attempt's number." Needs either the Laravel source or a targeted query (same user + same test, multiple `results` rows, compare `attempts` values across them) to resolve. |
| `catogeries`/`subcatogeries` ↔ `questionbanks`/`questiontags` | Two parallel, currently-**unlinked** classification trees — one used for courses/test-series/batches, the other for questions. There is no column anywhere that connects a `questionbanks` row to a `catogeries` row. Mapping a legacy question bank to a new `Exam` therefore **cannot be automated** and requires a manual, one-time, 55-row lookup table from a human who knows what each question bank actually represents. |
| `liveclasses`/`livecls` vs `classes`/`classnotices` | Two schemas that both describe "a scheduled live video session," with different fields (YouTube-oriented vs. Zoom-credential-oriented) and very different row counts (441 combined vs. 11 combined) — reads like two product generations coexisting, but which one (if either) is still actively used by the current production app can't be determined from the data alone. |
| `packageoffers.keyfetaures` | Free-text marketing description of what a purchasable package includes — there is no structured table saying "this package grants access to course X, test-series Y, batch Z." This means **the actual entitlements behind every historical package purchase are not recoverable from the database.** See `LEGACY_TO_NEW_MAPPING.md` §Packages/Subscriptions for the two honest options given this constraint. |

## Tables with a plausible mapping that still needs a scope decision (not "ambiguous" so much as "a choice")

These aren't unclear in *purpose* — they're clear — but mapping them either requires extending the current schema (real engineering work) or a decision to leave them out of scope for this pass:

- `pdftestseries` / `pdftests` — clear purpose (downloadable PDF test papers), no structural equivalent in the current schema, and no per-question data to extract even if one were built.
- `postalcourses` / `purchasepcourses` — clear purpose (physical mail-order course materials with shipping), entirely outside the current e-commerce model.
- `liveclasses` / `livecls` / `classes` / `classnotices` (setting aside the "which system is current" ambiguity above) — even the more modern-looking `classes`/Zoom system has no equivalent scheduled-live-video model in the current schema.
- `blogcomments` / `discussions` / `discussioncomments` / `lcomments` / `lecturecomments` / `pcomments` — no comment/discussion system exists in the current platform at all.
- `batches`' offline/physical-centre fields (`batchOfflineMRP`, `batchOfflineCapacity`, etc.) — the current `Batch` model only supports a single online price/capacity; the physical-coaching-centre side of the business (also evidenced by `branches`/`enquiries`) would need real modeling work, not just a field-by-field copy.

None of the above have been migrated, modeled, or decided on in this document — they're listed here specifically so they don't get silently dropped without anyone having made an actual decision to drop them.

# Human Decisions Required Before Migration Proceeds

This consolidates every decision point raised across the Task 1–7 documents into one place. Nothing below has been decided unilaterally — each is a real fork in the road found while building the actual designs and datasets, not a hypothetical.

## Blocking (migration cannot proceed correctly without these)

1. **The 55-row question-bank → Exam/ExamCycle/Subject/Topic mapping.** [`legacy-question-bank-mapping.csv`](./legacy-question-bank-mapping.csv) is built and ready for the `adminDecision` column to be filled in. Until at least some rows are confirmed, questions can only be imported without a real `examId` (see `PROPOSED_SCHEMA_ADDITIONS.md`'s `PENDING_MAPPING` status). **51 of the 55 banks are `PENDING_ADMIN_REVIEW`; 4 look like demo/empty banks worth confirming as excluded rather than mapped.**

2. **Password-migration reachability for 3,871 of 4,332 users (89.3%) who have no verified email or phone.** Three options laid out in `PASSWORD_MIGRATION_DESIGN.md` — this affects the large majority of the user base and needs a real product decision, not a default.

3. **What `coupons.ccFor` and `coupons.ccType` mean.** No lookup table exists in the DB (`AMBIGUOUS_AND_UNMAPPED_TABLES.md`). Without this, migrated coupons risk having the wrong discount type/target. Needs either the original Laravel source consulted, or the product owner to state the mapping from memory/documentation.

## Significant (affects scope/correctness but has a safe default if no answer comes)

4. **Legacy packages/subscriptions have no structured entitlement data** (`packageoffers.keyfetaures` is marketing prose, not a content list). `LEGACY_TO_NEW_MAPPING.md` lays out two honest options; the safer default (migrate purchase history only, let the product team define fresh `SubscriptionPlan`/`PlanEntitlement` rows) is recommended but not applied.

5. **`users.type = 'QA'`** has no home in the current two-value `Role` enum (`STUDENT`/`ADMIN`). Needs a decision: extend the enum, treat as `ADMIN`, or exclude from migration pending manual handling.

6. **Legacy `testsections`** (per-section grouping/marks within a test) has no equivalent in the current `Test`/`TestQuestion` model. Default recommendation is to flatten it away (questions still import, just without section grouping) unless the product confirms section-level reporting is a hard requirement.

7. **`liveclasses`/`livecls` vs `classes`/`classnotices`** — two parallel "scheduled live video session" systems coexist with very different schemas and row counts. Needs someone who knows the production app to confirm which (if either) is still active before any migration effort is spent on either.

## Lower stakes (can reasonably default, but flagging so nobody assumes silently)

8. **`results.attempts` vs `tests.attempts`** — ambiguous whether it's "max attempts allowed" or "this attempt's number." Not resolved; the current design (`LEGACY_TO_NEW_MAPPING.md`) simply doesn't migrate this field until it's confirmed, which is safe but does mean a small amount of legacy context is dropped by default.

9. **PDF test series, postal courses, batch offline/physical-centre fields, and the comment/discussion tables** are all flagged as out-of-scope-by-default in `LEGACY_TO_NEW_MAPPING.md` and `AMBIGUOUS_AND_UNMAPPED_TABLES.md`. If any of these actually matter to the business, that needs to be said explicitly — the default here is "not migrated," not a placeholder for "figure it out later automatically."

10. **The `BILINGUAL` auto-split for options and explanations has not been verified to follow the same "trailing parenthetical" pattern found for question stems** (`LANGUAGE_CLASSIFICATION_DESIGN.md`). This needs a quick verification pass before the multilingual import logic can be trusted to run unattended even for the confidently-classified questions.

## What's explicitly NOT waiting on a decision

Everything else in Tasks 1–7 — the migration-status state machine, the duplicate-review data model, the invalid-question queues, the dashboard's read-only structure — is designed and ready to be built as soon as the schema additions in `PROPOSED_SCHEMA_ADDITIONS.md` are approved. Those don't need a business decision, just a go-ahead to write code.

**No code has been written against these designs. No schema migration has been run. No legacy data has been imported. Waiting for direction on the items above, per Task 10.**

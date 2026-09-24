# Migration Dashboard Specification (Task 7)

Status: **specification only — no admin UI has been built.** Every number below is a real count from the dump (or, for "imported"/"pending" style counters, the honest current value — which is zero/full-pending everywhere, because no import has run).

## Purpose

A single admin-facing screen that answers, at a glance: how much legacy data exists, how much of it has been migrated, and — critically — how much is stuck waiting on a human decision, broken down by *which* decision. This is the control surface for everything designed in Tasks 1–6; it doesn't do the migration, it shows its state.

## Section 1 — Question Bank

| Metric | Query source | Current real value |
|---|---|---|
| Total legacy questions | `COUNT(*) FROM questions` (legacy) | **36,918** |
| Imported | `COUNT(*) FROM question_migration_records WHERE status IN ('IMPORTED','IMPORTED_WITH_WARNING')` | **0** — no import has run |
| Pending question-bank mapping | blocked on Task 1's 55-row CSV being filled in | **36,918** (effectively all of them, until at least one `adminDecision` is confirmed in `legacy-question-bank-mapping.csv`) |
| Duplicate review | rows belonging to one of the 580 real duplicate groups found in Task 3 | **1,201** |
| Invalid (answer or type) | Task 4's two queues, combined | **48** (7 + 41) |
| Language review required | `MIXED` + `UNKNOWN` from Task 5's classification | **7,339** (7,338 + 1) |
| Errors | would come from `QuestionMigrationRecord.migrationError IS NOT NULL` once an import actually runs | **0** (nothing has run yet — an honest dashboard shows 0 here, not a guess) |

These categories **overlap** (a question can be both duplicate-review *and* language-review-required) — the dashboard must show them as independent filtered counts, not a partition that's expected to sum to 36,918. A single stacked "total accounted for" bar would misrepresent this data; a small multiple of independent counters is the honest representation.

## Section 2 — Other Legacy Entities (real counts, from the full table-row-count pass in `LEGACY_DATABASE_ANALYSIS.md`)

| Entity | Legacy count | Imported |
|---|---|---|
| Users | 4,332 | 0 |
| Tests (`tests`) | 646 | 0 |
| Test Series | 50 | 0 |
| Practice Tests | 660 | 0 |
| Courses | 33 | 0 |
| Batches | 28 | 0 |
| Test Attempts (`results`) | 1,390 | 0 |
| Test Answers (`examanswers`) | 27,349 | 0 |
| Enrollments (`csenrolls`+`tsenrolls`+`praenrolls`+`ptsenrolls`+`batchenrolls`) | 4,330 | 0 |
| Payments (`purchasecourses`+`purchasetests`+`purchasebatches`+`purchasenotes`+`purchasepackages`+`purchasepdftests`+`purchasepcourses`) | 1,515 | 0 |
| Coupons | 11 | 0 |
| Question Banks (Task 1 scope) | 55 | 0 mapped / 55 pending |

## Section 3 — Review Queues (the actionable part of the dashboard)

Four queues, each linking to its own review UI (specified in the corresponding Task doc, not yet built):

1. **Question-Bank Mapping** (Task 1) — 55 rows, `mappingStatus` breakdown: how many `PENDING_ADMIN_REVIEW` vs `LIKELY_NOT_REAL_CONTENT` vs confirmed. Real current split, counted directly from `legacy-question-bank-mapping.csv`: **4 flagged `LIKELY_NOT_REAL_CONTENT`** (demo/empty banks), **51 `PENDING_ADMIN_REVIEW`**, **0 confirmed**.
2. **Duplicate Groups** (Task 3) — 580 groups, with the 15 `hasAnswerConflict=true` groups surfaced first as highest-priority.
3. **Invalid Questions** (Task 4) — 7 + 41 = 48 rows across the two issue types.
4. **Language Review** (Task 5) — 7,339 rows classified `MIXED`/`UNKNOWN`.

Each queue's card shows: total count, count resolved, count remaining, and a "resume review" link — not just a static number, since these are living worklists an admin works through over time, not a one-time report.

## Section 4 — Password Migration Readiness (Task 6)

| Metric | Value |
|---|---|
| Legacy users with a verified email or phone (can receive a reset link/OTP through the existing flow) | **461** (5 email-only + 329 phone-only + 127 both) |
| Legacy users with **no** verified contact | **3,871 (89.3%)** |

This section exists specifically so the 89.3%-unverified finding from `PASSWORD_MIGRATION_DESIGN.md` isn't buried in a doc nobody re-reads — it's front-and-center on the dashboard precisely because it's the biggest open risk in the whole plan.

## What the dashboard does NOT do

- It does not trigger a migration run — it's read-only, reflecting `QuestionMigrationRecord`/`LegacyIdMap`/`QuestionDuplicateGroup`/`InvalidQuestionReview` table state, which some other, explicitly-invoked process writes.
- It does not let an admin bulk-approve anything sight-unseen — every review queue requires opening individual items (or, at most, an explicit multi-select with a visible list of what's being approved), never a single "approve all" button for content that hasn't been looked at.
- It does not show fabricated progress. If nothing has been imported, it says **0**, not a projected/estimated number.

## Build order (once approved)

This is a read-only reporting screen over tables that don't exist yet (`QuestionMigrationRecord`, `QuestionDuplicateGroup`, `InvalidQuestionReview`) — so it can't be built before those schema additions are approved and migrated, and it has no real data to show before at least the question-bank-mapping and invalid-question passes have run once. It's the last thing built in this phase, not the first.

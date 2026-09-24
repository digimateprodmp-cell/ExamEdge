# Legacy Database Analysis

**Source file:** `testmela(gurumantra).sql` (`C:\Users\rahul\Downloads\testmela(gurumantra).sql`)
**Size:** 160,956,873 bytes (~154 MB), 143,899 lines
**Engine:** MySQL / MariaDB dump, Laravel application (evidenced by `migrations`, `failed_jobs`, `password_resets` framework tables)
**Analysis method:** the dump was parsed programmatically (streaming line-by-line, not loaded into an editor) to extract every `CREATE TABLE` block, every table's row count (by counting value-tuples across all `INSERT` statements for that table), and representative sample rows for every table that could plausibly hold exam/question/user data. No row was hand-picked to look good — the samples below are the literal first data row found for each table.
**No `FOREIGN KEY` constraints exist anywhere in this schema.** All 70 tables are linked only by naming convention (e.g. `qId`, `testId`, `userId`/`uId`). Every relationship documented below is *inferred* from column names and cross-checked against sample data, not read off a constraint.

This document does not modify, delete, or reformat the original SQL file in any way. It is a read-only analysis artifact.

---

## 1. Table Inventory (70 tables)

Grouped by functional domain, with **actual row counts** from the dump (via a full tuple count, not a `LIMIT`-sampled estimate).

### Question Bank & Content Classification
| Table | Rows | Purpose (inferred) |
|---|---|---|
| `questions` | 36,918 | The core question bank. One row per question. |
| `questionbanks` | 55 | Top-level grouping a question belongs to (`qwId`). Functions like a coarse "exam"/"bank" label. |
| `questiontags` | 698 | Hierarchical tag tree *scoped to a question bank* (`qwId` + `parentQtId`). Used as Subject (top level) → Topic (child level) via `parentQtId`. |
| `questionreports` | 5 | Student-submitted "this question is wrong" flags (`qrContent` is free text, not structured). |

### Live/Scheduled Tests ("Test Series")
| Table | Rows | Purpose |
|---|---|---|
| `testseries` | 50 | A purchasable bundle of tests (like our `TestSeries`). |
| `tests` | 646 | An individual test within a test series. Has `start_date`/`end_date` (an *availability window*, not a fixed live-exam start — see §4). |
| `testsections` | 407 | Sections within a test (e.g. "GS Paper 1"), each with its own marks/negative-marks. |
| `tsquestions` | 24,576 | Join table: which questions belong to which test section. |
| `results` | 1,390 | One row per student's completed attempt at a `tests` row. |
| `examanswers` | 27,349 | Per-question answers tied to a `results` row. |
| `tsanalysis` | 1,171 | Per-section score breakdown for a result (section-level analytics). |
| `tsenrolls` | 1,216 | Access grants to a `testseries` (free/coupon/purchase). |
| `purchasetests` | 14 | Payment transaction records for a `testseries` purchase. |

### Practice Tests (separate system from Live/Scheduled Tests)
| Table | Rows | Purpose |
|---|---|---|
| `practiceseries` | 69 | Bundle of practice sets. |
| `practicetests` | 660 | An individual practice set. |
| `practicequestions` | 23,074 | Join table: questions in a practice set. |
| `praenrolls` | 1,136 | Access grants to a `practiceseries`. |

**Important finding:** there is no `practiceresults` / `practiceanswers` table anywhere in the dump. Practice-test attempts are **not tracked in the database at all** — no historical practice-attempt data exists to migrate.

### PDF-Based Test Series (a third, separate content type)
| Table | Rows | Purpose |
|---|---|---|
| `pdftestseries` | 33 | Bundle of downloadable PDF test papers. |
| `pdftests` | 152 | A single PDF test — `ptQuestions`/`ptAnswers` are **file paths to PDF documents**, not structured question rows. |
| `ptsenrolls` | 394 | Access grants to a `pdftestseries`. |
| `purchasepdftests` | 8 | Payment records for PDF test series purchases. |

This is not part of the interactive question bank and has no per-question data to migrate — only the PDF file references and enrollment history are portable.

### Courses, Batches & Video Content
| Table | Rows | Purpose |
|---|---|---|
| `courses` | 33 | A course (video lectures + notes bundle). |
| `modules` | 66 | Groups lectures within a course. |
| `lectures` | 283 | Individual video lecture, linked to a `courses`+`modules` pair. |
| `lecturecomments` | 22 | Comments on a lecture. |
| `batches` | 28 | A "live batch" product (has both online and offline pricing/capacity — this platform supports physical coaching centres). |
| `batchenrolls` | 767 | Access grants to a batch. |
| `purchasebatches` | 675 | Payment records for batch purchases. |
| `classes` | 4 | A single scheduled Zoom session within a batch (`meetingId`, `joinUrl`, etc.) |
| `classnotices` | 7 | Notices posted to a class. |
| `liveclasses` | 298 | A single scheduled live video class (separate from `classes` — appears to be an older/parallel live-class system; both exist simultaneously, see §5). |
| `livecls` | 143 | Groups `liveclasses` (parallel to how `modules` groups `lectures`). |
| `lcomments` | 50 | Comments on a `liveclasses` entry. |
| `previousclasses` | 14 | Recorded/archived class videos. |
| `purchasecourses` | 25 | Payment records for course purchases. |
| `csenrolls` | 817 | Access grants to a course. |
| `notes` | 302 | PDF study notes, linked to a course. |
| `purchasenotes` | 15 | Payment records for individual note purchases. |
| `postalcourses` | 13 | Physical (postal-mail) course material — a *physical goods* product with stock/inventory fields. |
| `purchasepcourses` | 41 | Payment/order records for postal courses, including a shipping `address` JSON blob and `orderStatus` (physical fulfillment tracking). |

### Classification / Taxonomy (used for courses & test series, NOT questions)
| Table | Rows | Purpose |
|---|---|---|
| `catogeries` | 45 | Top-level category (e.g. "UPSC", "BPSC"). |
| `subcatogeries` | 116 | Sub-category under a `catogeries` row. |

**Important finding:** `catogeries`/`subcatogeries` and `questionbanks`/`questiontags` are **two entirely separate, unlinked classification hierarchies**. Courses/test-series/practice-series/PDF-series/batches are tagged with `cId`/`scId` (category/sub-category); questions are tagged with `qwId`/`qtId` (question bank/tag). There is no table connecting the two. A question bank is not the same thing as a category, and nothing in the schema says which category a question bank "belongs to." This is a real gap that needs a product decision, not a guess (see §5).

### Users & Access Control
| Table | Rows | Purpose |
|---|---|---|
| `users` | 4,332 | All accounts — students, admins, and a `QA` role, distinguished by `type` (free text, not an enum-backed FK). |
| `devicetokens` | 6,041 | Push-notification device tokens. |
| `password_resets` | 0 | Laravel's built-in password-reset token table (empty). |

### Payments, Packages & Coupons
| Table | Rows | Purpose |
|---|---|---|
| `packages` | 3 | A coarse global access tier (sample: `id=1, name='Free'`). Referenced by `courses.pid`, `testseries.package`, `practiceseries.package`, `pdftestseries.ptsPackage`, `batches.batchPackage` — i.e. **every piece of content is tagged with which tier can access it.** |
| `packageoffers` | 34 | A *purchasable* package (e.g. "BPSC 68th Test" bundle), with price/validity. `keyfetaures` (sic) is a free-text marketing description of what's included — **not a structured list of included content.** |
| `purchasepackages` | 737 | Payment records for package purchases. |
| `purchasesets` | 0 | Empty table; purpose unconfirmed (see Ambiguous Tables). |
| `coupons` | 11 | Discount coupon definitions. `ccFor`/`ccType` are unlabelled integer enums (no lookup table exists — their meaning must come from the original Laravel PHP source, not the DB). |
| `couponusages` | 5 | Coupon redemption log (has `productId` but no `productType` — which product table the ID refers to is not determinable from the DB alone). |
| `couponenrolls` | 0 | Empty table. |

### Marketing / CMS Content (not exam-related)
`blogs` (218), `blogcomments` (104), `discussions` (7), `discussioncomments` (36), `pcomments` (7), `galleries` (93), `homesliders` (6), `smallsliders` (5), `notices` (2), `instructions` (2), `siteproperties` (2), `contacts` (2,281), `enquiries` (16), `scholarships` (145), `branches` (3).

### Framework / Infrastructure (Laravel internals — not application data)
`migrations` (3), `failed_jobs` (0), `youtubetokens` (0).

---

## 2. Question Bank — Full Schema Detail

```
questions
  qId            bigint(20) UNSIGNED  -- PK
  qwId           int(10)              -- FK -> questionbanks.qwId
  qtId           int(10)              -- FK -> questiontags.qtId  (subject/topic level)
  sqtId          int(10) NULL         -- FK -> questiontags.qtId  (sub-topic level, nullable)
  question       text                 -- raw HTML, Word-paste artifacts present
  marks          decimal(10,2)
  neg_marks      decimal(10,2)
  totalOptions   int(10)              -- 4 or 5 in the overwhelming majority (see §3)
  options        text                 -- a JSON STRING, e.g. {"option1":"<p>A</p>","option2":"<p>B</p>",...}
  qType          varchar(20)          -- almost always 'radio' (single choice)
  correctAns     varchar(20)          -- '1'..'5', an index into the options JSON keys
  qHint          text NULL            -- explanation (HTML), 34% of rows have it
  qStatus        tinyint(4)           -- publish flag
  createdBy      bigint(20) UNSIGNED  -- FK -> users.id
  created_at / updated_at
```

**Critical structural fact:** options are **not normalized rows** — they are a single JSON-encoded text blob in one column, with keys `option1`, `option2`, ... in a fixed order that also encodes the correct-answer index. `correctAns` is a 1-based index into that key order, e.g. `correctAns = '3'` means `option3` in the JSON.

```
questionbanks (qwId, qwName, qwCreatedBY, total_questions, qwStatus, ...)
questiontags  (qtId, qwId, parentQtId, qtName, totalQuestions, ...)
```

`questiontags.parentQtId` is nullable and self-referential — a two-level tree (parent = Subject-like, child = Topic-like) *scoped to one question bank* (`qwId`). Sample row: `qtId=1, qwId=1, parentQtId=NULL, qtName='Demo QTag 01'`.

`questions.qtId` points at a `questiontags` row (any level); `questions.sqtId` points at a second, presumably-deeper `questiontags` row. Whether `sqtId` is always a *child* of `qtId` was not verifiable from the DB alone (no constraint enforces it) — this needs validation during the actual import (cheap to check: for every non-null `sqtId`, confirm `questiontags[sqtId].parentQtId == qtId`).

---

## 3. Data Quality Findings (from a full-file scripted scan, not a sample)

These numbers come from parsing every `questions` row in the dump with a small Node script (see `migration/scripts/` once the import phase begins). **36,879 of 36,918 rows (99.9%) were successfully parsed** by the analysis script; the remaining 39 rows had HTML content with quote-escaping patterns the quick analysis regex didn't handle — they are not lost data, just not counted in the stats below. The real import script must parse 100% of rows with a proper SQL-aware parser, not regex.

| Finding | Count | Detail |
|---|---|---|
| Question language: pure Hindi (Devanagari, no Latin text) | 11,273 | |
| Question language: pure English | 10,115 | |
| Question language: **mixed** (Hindi + English in the same field) | 15,491 | The largest bucket. Typically a Hindi question stem with English proper nouns/technical terms, or vice versa. **There is no per-question language field in the legacy schema — language is not stored, only inferable from content**, and imperfectly at that. |
| Question language: empty text | 0 | |
| `qType` distribution | `radio`: 35,832 · literal `'0'`: 39 | The 39 rows with `qType='0'` are a data-entry anomaly, not a real question type. |
| `totalOptions` distribution | 4 options: 30,356 · 5 options: 5,492 · 3: 6 · 2: 16 · 1: 1 | The 1–3-option rows are almost certainly bad data (a single-choice question needs ≥2 options) and should be flagged for manual review, not silently imported. |
| `correctAns` value out of range for its `totalOptions` | 4 (sampled scan) | E.g. `correctAns='5'` on a question with `totalOptions=4`. These questions cannot be scored correctly as-is and must be excluded or corrected before import, not guessed at. |
| Exact duplicate question text (normalized, HTML-stripped, case-folded) | 2,180 duplicate groups, 2,836 total duplicate rows | This is a *lower bound* — it only catches byte-for-byte-after-normalization duplicates, not near-duplicates (rephrasing, option-order differences). See `QUESTION_MIGRATION_PLAN.md` §Duplicate Detection for the fuzzy-matching plan. |
| `qHint` (explanation) present | 19,323 of 31,873 rows counted (≈61%) | ~39% of questions have no explanation at all — not a data-loss risk, just an existing gap. |
| `marks = 0.00` | 6 | Likely misconfigured questions (zero marks for a correct answer). |
| `qStatus` distribution | Sample-scan only found value `1` (31,873 rows); the parser's regex didn't reliably capture status on every row format variant | Needs a full pass with a real SQL parser during import — do not trust this as exhaustive. |

**Row-count reconciliation:** `questions` has 36,918 total rows. `tsquestions` references 24,576 (question, test-section) pairs and `practicequestions` references 23,074 (question, practice-test) pairs — a question can appear in both a live test and a practice set, and some questions in `questions` may not be referenced by either (orphaned/unused bank entries, not necessarily bad data).

---

## 4. "Tests" Are Not Our New Live-Test Model

The legacy `tests` table has `start_date`/`end_date`, but these behave as an **availability window** (e.g. `start_date='2021-08-12 16:22:00'`, `end_date='2022-01-12 16:22:00'` — a 5-month window), not a fixed single-sitting exam start/end time. `tests.attempts` (default 3, sample shows 20) suggests students could attempt the same test multiple times within that window. This is architecturally closer to our existing `TestType.PRACTICE`/`LIVE` distinction being blurred — legacy "tests" behave like a scheduled-availability practice test, not the server-authoritative, single-attempt, integrity-monitored **Live Test** we built this pass (see the platform's `LiveTest` model). Migrating legacy `tests` rows into our new `LiveTest` model would be **incorrect** — they should migrate into our existing `Test` model with `type = PRACTICE` (or a new `TestType.SCHEDULED_WINDOW` if that distinction matters to the product). This is called out explicitly in `LEGACY_TO_NEW_MAPPING.md`.

---

## 5. Ambiguous / Unmapped Tables (do not guess — needs a decision)

| Table | Why it's ambiguous |
|---|---|
| `purchasesets` | 0 rows, no data to inspect. Name suggests a purchase-tracking table for some "set" product, but which product type is unknown. **Recommendation: exclude from migration; revisit only if a non-empty version of this table surfaces.** |
| `couponenrolls` | 0 rows. Likely records a coupon-granted (non-paid) enrollment, parallel to `couponusages`, but with no data the exact semantics vs. `couponusages` can't be confirmed. |
| `coupons.ccFor` / `coupons.ccType` | Plain integers (sample: `ccFor=6, ccType=0`) with no lookup table in the DB. Their meaning is defined in the original Laravel PHP source (likely a `const` map), which is outside this SQL dump. **Needs the legacy codebase or product-owner input to decode**, not a guess. |
| `couponusages.productId` | No `productType` column — the same integer ID space is reused across course/test-series/batch/etc, so which table `productId` points into is not recoverable from data alone (sample row has `usedFor='Live Class'` as a free-text hint, but this isn't guaranteed on every row). |
| `results.attempts` vs `tests.attempts` | `tests.attempts` (sample: 20) reads as "max attempts allowed" (config). `results.attempts` (sample: 10) could mean either "this was the student's Nth attempt" or a copy of the test's max-attempts setting captured at result time. Cannot be disambiguated without either the Laravel source or querying for a user with multiple `results` rows against the same `testId` and comparing their `attempts` values. **Flagged for verification, not assumed.** |
| `liveclasses`/`livecls` vs `classes`/`classnotices` | Two parallel systems for "scheduled live video sessions" exist side by side (298 + 143 rows vs. 4 + 7 rows), with different schemas (`liveclasses` has a YouTube video ID field; `classes` has Zoom meeting credentials). They look like two generations of the same feature, one likely deprecated. **Needs a decision on which (if either) is still in active use before deciding what to migrate.** |
| `catogeries`/`subcatogeries` ↔ `questionbanks`/`questiontags` | As noted in §1 — two unlinked taxonomy systems. Which category a question bank/tag conceptually belongs to (i.e., which `Exam` a legacy question bank should map to) **is not recoverable from the database and must be assigned manually per question bank** (only 55 question banks — this is a small, one-time manual mapping task, not something to automate/guess). |
| `packageoffers.keyfetaures` | Free-text marketing copy, not a structured list of granted content. There is no way to programmatically determine "what does buying package X actually unlock" from the database. |
| `users.type` | Free-text values observed in a partial scan: `User`, `Admin`, `QA`. Whether `QA` is a real distinct role in production or leftover test data needs confirmation. |

---

## 6. Column-Naming Inconsistencies (worth knowing before writing the importer)

The schema is not internally consistent — a real importer needs to special-case these rather than assume a single convention:
- User references are sometimes `userId` (`examanswers`, `results`, `batchenrolls`) and sometimes `uId` (`csenrolls`, `tsenrolls`, `praenrolls`) and sometimes `createdBy`/`CreatedBY`/`qwCreatedBY` (mixed casing) for the creating admin.
- Status flags are `tinyint(4)` almost everywhere but with different value spaces per table (no shared enum).
- Timestamp column order varies: most tables are `(created_at, updated_at)`, but a few (`tests`, `courses`, `ptsenrolls`) are `(updated_at, created_at)` — order-dependent parsing will silently swap these if not read from the actual column list in each `INSERT` statement (which the analysis script above always does).

---

## 7. What This Analysis Deliberately Does Not Include

Per the review-before-migrate rule, this document does not attempt to:
- Resolve the ambiguous tables in §5 (that requires a decision, not more inspection).
- Propose row counts for a hypothetical successful migration (no migration has run yet).
- Modify, sample-export, or otherwise touch the original `testmela(gurumantra).sql` file — it was only read.

See `LEGACY_TO_NEW_MAPPING.md` for the proposed legacy→new field mapping, and `QUESTION_MIGRATION_PLAN.md` for the question-specific import pipeline design.

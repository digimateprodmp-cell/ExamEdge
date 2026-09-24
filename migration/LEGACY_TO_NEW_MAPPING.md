# Legacy → New Schema Mapping

This maps every legacy table with real application data to either an **existing** model in `backend/prisma/schema.prisma` (built in the earlier Live Test / multi-exam pass) or a **proposed new** model (see `PROPOSED_SCHEMA_ADDITIONS.md`). Nothing here has been applied to the running schema or database — this is a planning document only, per the "stop after analysis" instruction.

Legend: ✅ = maps to an existing model · 🆕 = needs a new model · ⚠️ = ambiguous, decision needed before mapping (see `LEGACY_DATABASE_ANALYSIS.md` §5) · ⛔ = out of scope / not migrated

---

## Question Bank

| Legacy | New | Transformation rule |
|---|---|---|
| `questions.qId` | `Question.id` (via `LegacyIdMap`) | New cuid generated; legacy id preserved in `LegacyIdMap` (🆕), never reused as the new PK. |
| `questions.question` | `QuestionTranslation.text` | HTML-cleaned (strip Word-paste `<span style=...>` wrapper noise, keep semantic tags). Language is **detected**, not read from a column (see §Language below), and written to **one** `QuestionTranslation` row only — the other language is left absent, not fabricated. |
| `questions.qHint` | `QuestionTranslation.explanation` | Same row as above; HTML-cleaned. `NULL` → left `null`, not empty string. |
| `questions.options` (JSON text) | `QuestionOption` rows + `OptionTranslation` | Parse the JSON string; for each `optionN` key in order, create one `QuestionOption` with `order = N-1` and one `OptionTranslation` in the detected language. |
| `questions.correctAns` | `QuestionOption.isCorrect` | `correctAns` is a 1-based index into the *same key order* the options were parsed in. Set `isCorrect = true` on the matching `QuestionOption`. **Rows where `correctAns` is out of range for `totalOptions` (4 found) are excluded from import and listed in the import report, never defaulted to option 1.** |
| `questions.marks` | `Question.marks` | Direct copy. |
| `questions.neg_marks` | `Question.negativeMarks` | Direct copy. |
| `questions.qType` | `Question.type` | `'radio'` → `QuestionType.SINGLE_CHOICE`. The 39 rows with literal `'0'` are flagged as invalid and excluded, not guessed into a type. |
| `questions.qStatus` | `Question.status` (🆕 field, see below) | `1` → `PUBLISHED`; needs a full-file pass (not the sample scan) to confirm what other values exist before finalizing this mapping. |
| `questions.qwId` + `qtId` + `sqtId` | `Question.subjectId` / `topicId` / `subTopicId` | **Requires the manual question-bank→Exam mapping described below** — cannot be automated. |
| `questions.createdBy` | `Question.createdById` | Resolved through the migrated `User.id` (via `LegacyIdMap` on `users`). |
| `questions.created_at` / `updated_at` | `Question.createdAt` / `updatedAt` | Direct copy (preserves real history — not reset to import time). |
| — (no source column) | `Question.source` (🆕 field) | Set to `QuestionSourceType.IMPORTED` for every migrated row. |
| — | `Question.legacyId`, via `LegacyIdMap` (🆕) | `legacySource='testmela_gurumantra'`, `legacyTable='questions'`, `legacyId=qId`. This is also the idempotency key — re-running the import looks up this triple before inserting. |

**The question-bank → Exam mapping (manual, one-time, 55 rows):** `questionbanks` (55 rows) and `questiontags` (698 rows, two-level tree) have no link to `catogeries`/`Exam` in the source data (§5 of the analysis doc). Before any question can be imported with a real `examId`, an admin needs to produce a 55-row lookup table: `qwId → examId (+ examCycleId)`. Until that exists, imported questions can still be created with `subjectId`/`topicId` populated (from `questiontags`, which *is* self-consistent) but `examId` left null, and back-filled once the mapping is provided. This is called out as a blocking manual step, not something the import script should invent.

| Legacy | New | Transformation rule |
|---|---|---|
| `questiontags` (top-level, `parentQtId IS NULL`) | `Subject` ✅ | One `Subject` per top-level tag, scoped within its `qwId`'s eventual `Exam`. |
| `questiontags` (child, `parentQtId IS NOT NULL`) | `Topic` ✅ | Linked to the `Subject` created from its parent row. |
| `questions.sqtId`, if it points to a *third*-level tag | `SubTopic` (🆕 model) | Only needed if validation shows `sqtId` rows aren't already covered by the two-level `Subject`/`Topic` split — to be confirmed during import, not assumed up front. |
| `questionreports` | `QuestionReview` (🆕 model) or discarded | Only 5 rows; free-text `qrContent`, not a structured review workflow. Low value — recommend migrating as-is into a simple `QuestionReview.legacyNote` field rather than building new review-workflow structure around 5 rows. |

---

## Tests, Sections, Test-Attempts

| Legacy | New | Transformation rule |
|---|---|---|
| `testseries` | `TestSeries` ✅ | `tsName`→`titleEn`, `tsDescription`→`descriptionEn` (HTML-cleaned), `price`→`price`, `validity`→`validityDays`, `tsStatus`→`isPublished` (confirm value mapping first — sample row has `tsStatus=0` while published-looking content, so `0`/`1` meaning must be verified against more rows, not assumed to match our own `isPublished` boolean directly). |
| `tests` | `Test` ✅, with `type = PRACTICE` | See `LEGACY_DATABASE_ANALYSIS.md` §4 — legacy `tests` are availability-windowed, multi-attempt, **not** our new server-authoritative single-sitting `LiveTest`. Do not import into `LiveTest`. `start_date`/`end_date` → `Test.startAt`/`endAt` (used today only to gate `TestType.LIVE`, so only meaningful if a future decision reclassifies some of these as `LIVE`-type Tests rather than `PRACTICE`). |
| `testsections` | *(no direct equivalent — flatten)* | Our `Test`/`TestQuestion` model has no "section" concept. Two options, needs a product decision: (a) flatten sections away and just import all of a test's questions in order, losing the section-grouping and per-section marks; (b) add a `TestSection` model. Given `testsections` mostly just re-states marks/negMarks already present per-question, **(a) is the lower-risk default** unless section-level reporting is a hard requirement. |
| `tsquestions` | `TestQuestion` ✅ | `(testId, qId)` → `(testId, questionId)` via `LegacyIdMap` lookups on both sides. `order` derived from insertion order within the section (no explicit order column exists in `tsquestions` — confirm this is acceptable, since no explicit sequence data exists to preserve). |
| `results` | `TestAttempt` ✅ | `correct_ans`/`wrong_ans`/`final_marks`/`time_taken` → `correctCount`/`incorrectCount`/`score`/`timeTakenSeconds`. `status` set to `SUBMITTED` for all migrated rows (legacy has no in-progress-attempt concept to preserve — these are all completed). **`results.attempts` is not migrated until its meaning is confirmed (§5 of analysis doc)** — do not overwrite our own attempt-tracking semantics with an unverified legacy field. |
| `examanswers` | `TestAnswer` ✅ | `answer`/`correct_ans` → resolve to `QuestionOption.id` via the option's `order` (both are the same 1-based index scheme as `questions.correctAns`). `remarks` (tinyint, meaning unconfirmed) is preserved as raw metadata, not mapped to `isCorrect` directly — `isCorrect` is *recomputed* from the resolved option, per this platform's existing rule that scoring is always server-derived, never trusted from a source field. |
| `tsanalysis` | ⛔ not migrated by default | Purely a cached per-section score rollup, derivable from `TestAnswer` + `TestQuestion` at read time in the new system (which already computes results live in `AttemptsService`). Migrating it would mean maintaining a second, stale source of truth. |

---

## Practice Tests

| Legacy | New | Transformation rule |
|---|---|---|
| `practiceseries` | `TestSeries` ✅ (or a distinct concept, TBD) | Same shape as `testseries` — could be imported as another `TestSeries`, or the product may want Practice Series kept conceptually separate from Test Series. **Needs a decision**, not a default, since the new platform's Practice-vs-Live UX (§16/§42 of the new spec) is a first-class distinction the legacy system didn't really have. |
| `practicetests` | `Test` ✅, `type = PRACTICE` | |
| `practicequestions` | `TestQuestion` ✅ | Same resolution approach as `tsquestions`. |
| *(no attempt data exists — see analysis §1)* | — | Nothing to migrate; practice attempts start fresh in the new system. |

---

## PDF Test Series

| Legacy | New | Transformation rule |
|---|---|---|
| `pdftestseries` | ⛔ / 🆕 | Not the same shape as anything currently in the schema — it's a file-download product, not an interactive test. **Recommend: out of scope for the question-bank migration; migrate only as a simple downloadable-resource record (closer to `Note`) if the product wants these preserved at all.** |
| `pdftests` | ⛔ / 🆕 | Same reasoning — `ptQuestions`/`ptAnswers` are PDF file paths, no structured question data to extract. |
| `ptsenrolls`, `purchasepdftests` | `Enrollment` ✅ / `Payment` ✅ | If the product decides to keep PDF test series at all, these map cleanly (see Enrollments/Payments section below) — it's only the *content* (`pdftestseries`/`pdftests`) that has no clean home yet. |

---

## Courses, Notes, Video Content

| Legacy | New | Transformation rule |
|---|---|---|
| `courses` | `Course` ✅ | `courseName`→`titleEn`, `courseDescription`→`descriptionEn` (HTML-cleaned), `coursePrice`→`price`, `courseStatus`→`isPublished` (verify value mapping). `cId`/`scId` (category/sub-category) are **not** migrated into `Course` directly — our `Course` model has no category field; if categories matter, they'd need to become part of the `Exam` hierarchy instead (see the question-bank mapping decision above), not a parallel new category system. |
| `notes` (linked via `cId`) | `NoteVolume` + `Note` ✅ | Needs a synthetic `NoteVolume` per course (our schema nests `Note` under `NoteVolume` under `Course`; legacy nests `notes` directly under a category, not a course-owned volume) — `courseId` resolution for `notes.cId` is via the category, not a direct course FK, so this needs the same category-mapping decision as `courses` itself. |
| `lectures` (+ `modules`) | `Video` ✅ (lossy) | Our `Video` model has no "module" grouping concept — `modules` would be flattened away, losing the lecture-ordering-within-module structure, unless a `VideoModule` concept is added. |
| `batches` | `Batch` ✅ (lossy) | Our `Batch` model has no offline/physical-centre pricing or capacity fields (`batchOfflineMRP`, `batchOfflineCapacity`, etc.) — these would be dropped unless the model is extended. Given `enquiries`/`branches` also describe a real physical-coaching-centre business line, **this is worth a explicit decision rather than silently discarding physical-batch data.** |
| `liveclasses`/`livecls`, `classes`/`classnotices` | ⚠️ not mapped | See analysis §5 — two parallel systems, unclear which is current. No target model exists for either today. |
| `postalcourses`, `purchasepcourses` | ⛔ out of scope | Physical mail-order product with shipping/inventory concerns entirely outside this platform's current e-commerce model. |

---

## Users

| Legacy | New | Transformation rule |
|---|---|---|
| `users.id` | `User.id` (via `LegacyIdMap`) | |
| `users.name`/`email`/`contact` | `User.name`/`email`/`phone` | Direct copy; email/phone uniqueness must be checked against any already-seeded users before insert. |
| `users.type` | `User.role` | `'Admin'`→`ADMIN`, `'User'`→`STUDENT`. **`'QA'` has no target role in our `Role` enum (`STUDENT`/`ADMIN` only) — needs a decision** (treat as ADMIN? add a role? exclude from migration and handle manually?). |
| `users.password` | *not migrated* | The legacy password hash is Laravel's own encryption (`AES`-wrapped bcrypt per the sample — begins with `eyJpdiI6...`, a base64 JSON envelope, not a plain bcrypt hash our `passwordHash` field expects). **Do not attempt to reuse these hashes.** Every migrated user must go through a forced password-reset flow on first login post-migration — this is a security requirement, not a convenience choice. |
| `users.status` | `User.isActive` | Verify value mapping (`1`/`3` seen in the partial scan — `3`'s meaning unconfirmed). |
| `users.phoneVerified`/`email_verified` | `User.isPhoneVerified`/`isEmailVerified` | Direct copy (tinyint → boolean). |
| `users.package`/`startDate`/`expireDate` | `Subscription` ✅ (see Packages below) | |
| — | `User.referralCode` | Legacy has no referral system — must be freshly generated (unique) for every migrated user, not left null, since our schema requires it `NOT NULL UNIQUE`. |

---

## Enrollments & Purchases

The legacy system has **five separate enrollment tables**, one per product type, all with the same shape (`id, productId, userId, expired_at, created_at, updated_at`). All map to our single, polymorphic `Enrollment` model:

| Legacy table | `Enrollment.source` behaviour | Target `Enrollment` field |
|---|---|---|
| `csenrolls` | if there's a matching `purchasecourses` row → `PURCHASE`, else `ADMIN`/`COIN`/`COUPON` (needs the matching-purchase lookup to decide, not a blanket default) | `courseId` |
| `tsenrolls` | same lookup against `purchasetests` | `testSeriesId` |
| `praenrolls` | *(no matching purchase table exists for practice — see analysis, practice appears to always be free/bundled)* | would need a new `Enrollment.practiceSeriesId` if practice series become a distinct concept |
| `ptsenrolls` | matched against `purchasepdftests` | only relevant if PDF series are brought into scope |
| `batchenrolls` | matched against `purchasebatches`; `batchenrolls.enrollType` (0 in sample) is an unlabelled flag, needs decoding, not guessing | `batchId` |

And the purchase/payment tables:

| Legacy | New | Transformation rule |
|---|---|---|
| `purchasecourses`, `purchasetests`, `purchasebatches`, `purchasenotes`, `purchasepackages`, `purchasepdftests`, `purchasepcourses` | `Payment` ✅ | `razorpayId`→`razorpayPaymentId`, `paymentId` (this is actually the Razorpay **order** id in the sample data, despite the column name) → `razorpayOrderId`, `paymentStatus` (`'Success'`/`'Pending'`/...) → `PaymentStatus` enum (verify the full value set before finalizing the mapping — only `Success`/`Pending` seen so far). `itemType` is inferred from *which* purchase table the row came from (`COURSE`, `TEST_SERIES`, `BATCH`, `NOTE_VOLUME` already exist in our `PaymentItemType`; postal courses and PDF test series would need new enum values if brought into scope). |

---

## Packages / Subscriptions

**This is the single biggest architectural mismatch and needs an explicit product decision before writing any code.** The legacy model is a *flat, single global tier per user* (`users.package` + `startDate`/`expireDate`, referencing the 3-row `packages` table). `packageoffers` (34 rows) are purchasable bundles with **no structured record of what content they unlock** — only a marketing-copy string (`keyfetaures`). Our platform's new model (`SubscriptionPlan` → `PlanEntitlement` → `Subscription`, already built this pass) is structured and per-exam.

Two honest options, neither of which the import script should pick unilaterally:
1. **Best-effort migration**: create one `SubscriptionPlan` per legacy `packageoffers` row (name/price/validity carry over cleanly), with **no `PlanEntitlement` rows** (i.e., a migrated plan grants nothing specific until an admin manually configures its entitlements) — accurate to what the data actually says, doesn't fabricate entitlements that were only ever described in prose.
2. **Manual remap**: don't migrate `packageoffers` as `SubscriptionPlan` rows at all; instead migrate `purchasepackages` as historical `Payment` records only (for financial record-keeping), and have the product team define a fresh, small set of `SubscriptionPlan`+`PlanEntitlement` rows by hand, then manually grant active `Subscription` rows to users whose legacy `expireDate` is still in the future.

Recommendation leans toward (2) for correctness (the "which plan actually included live tests for which exam" question genuinely can't be answered from the data), but this is called out as a decision for the product owner, not something assumed here.

---

## Coupons

| Legacy | New | Transformation rule |
|---|---|---|
| `coupons` | `Coupon` ✅ | `ccCode`→`code`, `ccDiscount`→`value` (need to confirm `ccType` tells us PERCENT vs FIXED before mapping — currently unknown, see analysis §5), `ccValidity` (looks like a day-count, e.g. `365`) → needs converting into concrete `validFrom`/`validTo` timestamps rather than our schema's absolute-date fields, `ccLimit`→`usageLimit`. |
| `couponusages` | `CouponUsage` ✅ | Blocked on resolving `productId`'s target table (analysis §5) before `CouponUsage.paymentId` can be populated correctly. |
| `couponenrolls` | ⛔ 0 rows, nothing to migrate | |

---

## Blogs & Comments

| Legacy | New | Transformation rule |
|---|---|---|
| `blogs` | `Blog` + `BlogTranslation` ✅ | `blogTitle`/`blogContent` → `BlogTranslation` in the detected language (same language-detection approach as questions — legacy blogs are also monolingual per row, e.g. the sample is pure Hindi). `cId`/`scId` not mapped (our `Blog` uses a flat `BlogCategory`, not the course category tree — needs a fresh, small `BlogCategory` list rather than reusing `catogeries`). |
| `blogcomments`, `discussions`, `discussioncomments`, `lcomments`, `lecturecomments`, `pcomments` | 🆕 or ⛔ | No comment/discussion system exists anywhere in the current schema. **Recommend: out of scope for this migration pass** — these are a nice-to-have community feature, not core exam-platform data, and shouldn't block the question-bank migration that the new spec prioritizes. |

---

## Explicitly Out of Scope for This Migration

These have real data but no plausible new-platform destination and are not exam-critical: `galleries`, `homesliders`, `smallsliders`, `notices`, `instructions`, `siteproperties`, `contacts`, `enquiries`, `scholarships`, `branches`, `devicetokens`, `youtubetokens`, `failed_jobs`, `migrations`, `password_resets`, `purchasesets`. If any of these turn out to matter, they can be revisited — but importing them now would be scope creep against the spec's own priority order (question bank first).

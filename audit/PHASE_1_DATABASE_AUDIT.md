# Phase 1 Database Audit

Read-only. Source: `backend/prisma/schema.prisma` (1,165 lines, 50 models, 50 `@@index` declarations, 11 `@@unique` declarations — all counted directly, not estimated) plus live queries against the running dev MySQL instance (`docker exec test-mela-mysql mysql ...`).

## Model Inventory (50 models)

Grouped by subsystem, with real current row counts where queried:

**Identity/Auth:** `User` (2 rows), `RefreshToken`, `VerificationToken`
**Catalog (pre-existing, original build):** `Subject` (1), `Topic` (1), `Course`, `TestSeries`, `TestVolume`, `Batch`, `Enrollment`
**Test Engine (pre-existing):** `Test` (106), `Question` (6,271), `QuestionTranslation` (6,274), `QuestionOption` (26,872), `OptionTranslation` (26,884), `TestQuestion` (6,271), `TestAttempt` (16), `TestAnswer` (21)
**Content (pre-existing):** `NoteVolume`, `Note`, `Video`, `BlogCategory`, `Blog`, `BlogTranslation`, `CurrentAffairCategory`, `CurrentAffair`, `CurrentAffairTranslation`
**Commerce (pre-existing):** `Coupon`, `CouponUsage`, `CoinTransaction`, `Payment` (3)
**Exam layer (this phase):** `Exam` (0), `ExamCycle` (0), `SyllabusVersion` (0), `SyllabusTopic` (0), `StudentExamProfile` (0)
**Live Test (this phase):** `IntegrityPolicy`, `LiveTest` (1), `LiveTestAttempt` (1), `ExamIntegrityEvent` (2), `LiveTestAuditLog`
**Slots (this phase):** `TestSlot` (0), `SlotReservation` (0), `SlotBooking` (0)
**Subscriptions (this phase):** `SubscriptionPlan` (0), `PlanEntitlement`, `Subscription` (0)
**Notifications (this phase):** `Notification` (0), `NotificationPreference`, `NotificationRule` (0)

Models proposed in `migration/PROPOSED_SCHEMA_ADDITIONS.md` but **not present in the actual schema** (confirmed by `grep -c "model " schema.prisma` = 50, and by name): `SubTopic`, `QuestionVersion`, `QuestionTag`, `QuestionTagLink`, `QuestionReview`, `QuestionUsage`, `TestBlueprint`, `TestBlueprintSection`, `AiGenerationJob`, `LegacyIdMap`, `QuestionMigrationRecord`, `QuestionDuplicateGroup`, `InvalidQuestionReview`.

## Relationships — Verified, Not Assumed

**Correct and real:**
- `Exam 1—N ExamCycle 1—N SyllabusVersion 1—N SyllabusTopic N—1 Topic` — verified in schema, supports multiple cycles per exam and multiple versions per cycle with no overwrite path (additive by construction — no `update` anywhere touches a different version's `SyllabusTopic` rows).
- `StudentExamProfile @@unique([userId, examCycleId])` — correctly allows many profiles per user, one per cycle.
- `LiveTestAttempt @@unique([liveTestId, userId])`, wraps `TestAttempt 1—1` via `testAttemptId @unique` — correct reuse of the existing scoring pipeline rather than a duplicate one.
- `SlotBooking @@unique([slotId, userId])` — prevents a user double-booking the same slot.
- `TestSlot.bookedCount` incremented only via a transactional conditional `updateMany` — verified safe by a passing concurrency e2e test (see requirements matrix §9).

**Missing/incomplete relationships (this is the core finding of this audit, restated at the DB level):**
- **`Question` has no relation to `Exam`, `ExamCycle`, or `SyllabusVersion`.** Only `subjectId`/`topicId` exist. This means there is no way to write a Prisma query that says "give me questions for UPSC CSE 2027" — the join path doesn't exist in the schema.
- **`Test` has no relation to `Exam`/`ExamCycle` either** (only `LiveTest` does, via an *optional* `examCycleId`). The practice-test content hierarchy (`Course → TestSeries → TestVolume → Test`) and the new exam hierarchy are two disconnected graphs.
- **`TestAttempt` has no `examId`/`examCycleId`** — exam context for a completed attempt has to be derived transitively and inconsistently (via `Test`'s legacy hierarchy for practice, via `LiveTest.examCycleId` for live — two different paths, one of which is often null).
- No `SubTopic` model — `Question`/`SyllabusTopic` stop at `Topic`, one level short of the spec's three-tier ask.

## Missing Indexes / Constraints — Specific, Not Generic

Reviewed every model referencing a foreign-key-shaped field for a matching `@@index`:

- `Payment.itemId` — **no index.** `Payment` is looked up by `razorpayOrderId` (indexed via `@unique`) and by `userId` (`@@index([userId])`), but any query filtering/joining on `(itemType, itemId)` (e.g. "all payments for this course") does a full scan. Low risk at current scale (3 rows), real risk if `Payment` ever grows to production volume.
- `CouponUsage.productId` (mentioned in the migration docs, but checking the live model) — the *actual* schema's `CouponUsage` doesn't carry a raw `productId`; it's fine as designed (`couponId`, `userId`, `paymentId` all indexed or unique).
- `Notification` — correctly indexed (`@@index([userId, readAt])`, `@@index([userId, createdAt])`) — this one was done right.
- `StudentExamProfile.examCycleId` — **no explicit index.** Foreign-key columns in MySQL/Prisma aren't automatically indexed just by being a relation scalar unless Prisma's implicit FK indexing kicks in (it does for MySQL by default via the relation, so this is likely fine in practice — flagged for explicit verification with `SHOW INDEX FROM student_exam_profiles`, not assumed either way here).
- `QuestionOption.questionId` — indexed. `OptionTranslation.optionId` — implicit via `@@unique([optionId, language])`, fine.

## Potential Race-Condition Problems

- **Slot capacity — verified safe** (see above), the one place this was actually load-tested.
- **`StudentProfileService.setPrimary()`** — does `updateMany` (clear all `isPrimary`) then `update` (set new primary) inside a `$transaction` array — correct, atomic.
- **`AttemptsService.finalize()`** — single-writer per attempt in practice (a student can't submit twice concurrently in any meaningful way since the client only has one attempt open), but there is no explicit row lock or `WHERE status = 'IN_PROGRESS'` guard on the final `update` — if two requests somehow raced (e.g. a double-click bug client-side both hitting `/submit`), both could read `status='IN_PROGRESS'` before either write commits, and the transaction would run twice. **This is a real, if low-probability, gap** — not currently guarded by an atomic conditional update the way slot booking is. Not something to fix under an audit's "no code changes" rule, but flagged as a genuine finding.
- **`NotificationsService.create()`** — no dedup key of any kind (the earlier migration-planning doc for the notification *scheduler* specifically mentioned a dedupe key concept for cron-driven creates; the live `Notification` model has no unique constraint that would prevent a caller from creating duplicate rows for the same event if called twice). Currently moot since nothing calls it (§12 of requirements matrix), but worth fixing when that gap is closed.

## Data Integrity Problems Found

- **Bilingual data integrity**: 6,269 of 6,271 `Question` rows have exactly one `QuestionTranslation` row (Hindi), not two. This is not a schema bug (the schema correctly allows 0, 1, or 2 translations per question) — it's a content-completeness problem, already covered in depth in the requirements matrix §4.
- **`legacy_id_map` referenced in design docs, absent from the live schema** — anyone reading `migration/QUESTION_MIGRATION_PLAN.md` and querying for it will get a hard MySQL error, exactly as this audit did. Worth a note in that doc pointing here, or removing it once acted on.
- **`subjects`/`topics` tables contain 1 placeholder row each**, not real curriculum data — any current query joining `Question.subjectId` is joining against demo data.

## What Was NOT Checked (explicitly, so it's not silently assumed clean)

- Full `SHOW INDEX FROM <table>` output for every one of the 50 tables was not exhaustively dumped in this pass — the findings above come from reading the Prisma schema's declared `@@index`/`@@unique` blocks, which is what Prisma actually creates, but a live `SHOW INDEX` diff was not run table-by-table.
- Query performance (`EXPLAIN`) was not profiled — this audit is a structural read, not a performance audit.

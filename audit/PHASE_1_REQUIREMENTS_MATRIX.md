# Phase 1 Requirements Matrix

**Audit type:** read-only. No code, schema, or database was modified to produce this document. Every claim below was verified by reading the actual source file(s) cited, querying the actual running dev database, or both — not inferred from prior design documents.

**Database snapshot at time of audit** (`docker exec test-mela-mysql mysql ... COUNT(*)` against every relevant table):

```
questions 6271            question_translations 6274      question_options 26872
option_translations 26884 subjects 1                       topics 1
exams 0                   exam_cycles 0                    syllabus_versions 0
syllabus_topics 0         student_exam_profiles 0          tests 106
test_questions 6271       test_attempts 16                 test_answers 21
live_tests 1              live_test_attempts 1             exam_integrity_events 2
test_slots 0              slot_bookings 0                  slot_reservations 0
subscription_plans 0      subscriptions 0                  notifications 0
notification_rules 0      users 2                          payments 3
```

Status legend: 🟢 IMPLEMENTED · 🟡 PARTIALLY IMPLEMENTED · 🔴 NOT IMPLEMENTED · ⚠️ IMPLEMENTED BUT INCORRECT/RISKY

---

## 1. Student Profile — Multi-Exam Selection

**Requirement:** student can select multiple competitive exams, no one-exam restriction.

**Current implementation:**
- Database: `StudentExamProfile` model exists (`backend/prisma/schema.prisma:776`), `@@unique([userId, examCycleId])` — correctly allows many rows per user (one per exam cycle), `isPrimary` flag, `isActive` soft-remove. No artificial single-exam constraint in the schema.
- API: `backend/src/student-profile/student-profile.controller.ts` — `GET/POST/PATCH/PATCH :id/primary/DELETE /api/student/exams`, backed by `student-profile.service.ts`. Logic verified by reading the file: `add()` checks for an existing inactive row and reactivates it rather than duplicating; `remove()` reassigns `isPrimary` to the next-most-recent profile if the removed one was primary. This is real, correct, working code.
- Frontend: `frontend/services/student-profile.service.ts` exists as a thin API wrapper — **but it is imported by zero pages or components** (`grep -rln "studentProfileService|StudentExamProfile" app components hooks` returns only the service file itself). There is no "My Exams" UI, no add/remove/set-primary control, no exam switcher anywhere in the student app.
- Database confirms this: `student_exam_profiles` has **0 rows** — not because the feature is broken, but because nothing in the UI has ever called it.

**Files:** `backend/src/student-profile/*`, `frontend/services/student-profile.service.ts` (orphaned)
**DB models:** `StudentExamProfile`
**API routes:** `GET/POST /api/student/exams`, `PATCH /api/student/exams/:id`, `PATCH /api/student/exams/:id/primary`, `DELETE /api/student/exams/:id`
**Frontend components:** none

**Status:** 🟡 PARTIALLY IMPLEMENTED — backend is real and correct; frontend does not exist.
**Gap:** A student cannot select, view, or manage multiple exams through the product today — the capability exists only as an unused API.
**Risk:** Medium. Not a data-integrity risk (backend is sound), but it means a core Phase 1 requirement is currently invisible to real users.
**Recommended next action:** Build the "My Exams" page and header exam-switcher before claiming this requirement done.

---

## 2. Exam Architecture (Exam / ExamCycle / SyllabusVersion / Subject / Topic / SubTopic)

**Current implementation:**
- Database: `Exam`, `ExamCycle`, `SyllabusVersion`, `SyllabusTopic`, `Subject`, `Topic` all exist (`schema.prisma:695-769`). `ExamCycle` supports multiple cycles per `Exam` (no unique constraint blocking more than one cycle — `Exam.cycles ExamCycle[]` is a plain one-to-many). `SyllabusVersion` has a `version Int` field and no logic anywhere deletes or overwrites an old version — versions are additive by construction (confirmed by reading the model; there is no update path that touches a *different* version's rows).
- **`SubTopic` does not exist.** Grep for `model SubTopic` in `schema.prisma` returns nothing. The spec's three-level Subject→Topic→SubTopic hierarchy is only two levels in the actual schema (`Subject` → `Topic`). `SyllabusTopic` links a `SyllabusVersion` to a `Topic`, with a `weight` field — there's no third tier.
- Real data: **0 rows** in `exams`, `exam_cycles`, `syllabus_versions`, `syllabus_topics`. The architecture exists structurally but has never been populated, including via the admin (no admin UI to create one — see §16).
- `subjects`/`topics` have exactly **1 row each** — a placeholder from the original 45-section build, not real curriculum data.

**Files:** `backend/prisma/schema.prisma` (models), `backend/src/exams/*` (full CRUD service+controller, verified real)
**DB models:** `Exam`, `ExamCycle`, `SyllabusVersion`, `SyllabusTopic`, `Subject`, `Topic` — **no `SubTopic`**
**API routes:** `GET /api/exams`, `GET /api/exams/:id/cycles`, `GET/POST/PATCH/DELETE /api/exams(/admin)`, cycle and syllabus-version sub-routes (full list in `PHASE_1_API_AUDIT.md`)
**Frontend components:** none (no admin UI, no student-facing exam browser beyond the unused public `GET /api/exams`)

**Status:** 🟡 PARTIALLY IMPLEMENTED — two of three hierarchy levels exist and multi-cycle/versioning is correctly modeled; `SubTopic` is missing; zero real data; no UI at all (admin or student) to manage or browse it.
**Gap:** The exam/syllabus tree cannot currently be populated except by direct API calls (no admin screen exists).
**Risk:** Medium — blocks everything downstream that depends on a populated syllabus (practice-test filtering, AI context in Phase 2).
**Recommended next action:** Add `SubTopic` model if the product still wants three levels; build the admin Exam/Syllabus management UI (currently entirely absent).

---

## 3. Question Bank Architecture

**Requirement (per the spec):** Question, Translation, Option, Option Translation, Explanation, Exam/ExamCycle/Syllabus/Subject/Topic mapping, Difficulty, Source, Status.

**Current implementation — verified directly against the live database schema** (`DESCRIBE questions`):
```
id, subjectId, topicId, type, difficulty, marks, negativeMarks,
createdById, createdAt, updatedAt, deletedAt
```
- 🟢 `subjectId`/`topicId` mapping — present.
- 🟢 `difficulty` — present (`Difficulty` enum: EASY/MEDIUM/HARD).
- 🔴 **`examId`, `examCycleId`, `syllabusVersionId` — do not exist.** A question has no link whatsoever to the new Exam architecture from §2.
- 🔴 **`status` — does not exist.** There is no `QuestionStatus` enum, no DRAFT/PENDING_REVIEW/APPROVED/PUBLISHED/REJECTED/ARCHIVED workflow. Every question in the database is implicitly "live" the moment it's created — this was proposed in the earlier migration-planning phase (`migration/PROPOSED_SCHEMA_ADDITIONS.md`) but **never applied**.
- 🔴 **`source`/`sourceReference` — do not exist.** No way to distinguish MANUAL/IMPORTED/PREVIOUS_YEAR/AI_GENERATED/CURRENT_AFFAIRS at the data level.
- 🔴 `isAiGenerated`/`isAiVerified` — do not exist.
- `Explanation` — implemented as a field (`QuestionTranslation.explanation`), not a separate model, which is a reasonable simplification, not a gap.
- Options: `QuestionOption` + `OptionTranslation` are real, normalized tables (not JSON blobs like the legacy system) — 26,872 option rows for 6,271 questions (~4.3 options/question), consistent and correct.

**Files:** `backend/src/questions/*`, `backend/prisma/schema.prisma:343-404`
**DB models:** `Question`, `QuestionTranslation`, `QuestionOption`, `OptionTranslation` — no status/source/AI/exam-linkage fields
**API routes:** `GET/POST/PATCH/DELETE /api/questions`, `GET /api/questions/:id`
**Frontend components:** `admin/components/shared/question-form-dialog.tsx` (nested inside a Test's question list, no standalone Question Bank browser)

**Status:** 🟡 PARTIALLY IMPLEMENTED — the translation/option layer is solid and real; the workflow/provenance/exam-linkage layer described in the spec and in the earlier migration-planning docs does not exist in the actual schema.
**Gap:** Cannot filter or generate a test by Exam/ExamCycle/Syllabus; cannot review/approve a question before it's live; cannot tell an imported question from a manually-created one.
**Risk:** High — this is foundational for both the "practice test pulls from the right exam's pool" requirement (§6) and all of Phase 2 (AI generation needs `source`/`status` to gate publishing).
**Recommended next action:** Apply the schema additions already designed in `migration/PROPOSED_SCHEMA_ADDITIONS.md` (status quo: designed, not built).

---

## 4. Bilingual Requirement — CRITICAL

**Requirement:** every published question must have English AND Hindi question/options/explanation-where-present; must never publish with one language missing.

**Verified at every layer requested:**

1. **Database level:** 🔴 No constraint exists. `QuestionTranslation` has `@@unique([questionId, language])` (prevents *duplicate* EN or HI rows, says nothing about *requiring both*). Real query against the live data:
   ```sql
   SELECT language, COUNT(*) FROM question_translations GROUP BY language;
   -- EN: 5   HI: 6269
   SELECT COUNT(*) FROM (SELECT questionId FROM question_translations
     GROUP BY questionId HAVING COUNT(DISTINCT language) = 2) x;
   -- 3
   ```
   **Only 3 of 6,271 questions (0.05%) have both languages. 6,269 are Hindi-only.** This is not a theoretical gap — it is the actual state of the actual data right now.
2. **Backend validation:** 🔴 `backend/src/questions/dto/question.dto.ts` — `textEn` and `textHi` are both `@IsOptional()`. Nothing rejects a question submitted with only one language. No `status`/`isPublished` field exists to even gate "published" separately from "draft" (see §3), so there is no concept of "published without required language" to block — the whole publish gate is absent.
3. **Admin question creation:** 🔴 `question-form-dialog.tsx` (admin) — both language fields are present in the form but neither is marked required; nothing blocks submission with one blank.
4. **Bulk import:** 🔴 No bulk import endpoint or UI exists at all (see §17) — the legacy import script (`backend/prisma/import-legacy.ts`, from an earlier, separate legacy dataset) is a one-off script, not a re-runnable, validated bulk-import feature, and it imported Hindi-only content by design (the source data was Hindi-only).
5. **API:** 🔴 `POST/PATCH /api/questions` — same DTO, same lack of enforcement.
6. **Frontend:** 🟡 The practice-exam page *does* implement a real language switch (see §5) — but a real switch mechanism operating on data that's 99.95% single-language does not satisfy "every published question has both languages."

**Files:** `backend/src/questions/dto/question.dto.ts`, `backend/prisma/schema.prisma` (`QuestionTranslation`), `admin/components/shared/question-form-dialog.tsx`
**DB models:** `QuestionTranslation` (no enforcement)
**API routes:** `POST/PATCH /api/questions`
**Frontend components:** `question-form-dialog.tsx` (admin)

**Status:** 🔴 NOT IMPLEMENTED. This is stated plainly and without hedging: the bilingual requirement is not enforced anywhere in the stack, and the real data proves it — 6,269 of 6,271 questions are single-language.
**Gap:** Total, at every layer.
**Risk:** Critical — this was called out in the spec as CRITICAL, and it is the single largest gap found in this audit.
**Recommended next action:** Decide the enforcement point (most robust: a `status` field where transitioning to `PUBLISHED` requires both `QuestionTranslation` rows to exist, checked server-side in `QuestionsService`, not just the DTO) before building anything else that assumes bilingual content is guaranteed.

---

## 5. Language Switch

**Requirement:** switching EN↔HI changes question/options/explanation, preserves selected answer/position/attempt/timer.

**Practice Test page** (`frontend/app/[locale]/exam/[attemptId]/page.tsx` + `frontend/hooks/use-test-attempt.tsx`):
- 🟢 Real mechanism: `switchLanguage()` re-fetches the same attempt with a `?lang=` query param; the backend (`AttemptsService.getForStudent`, `attempts.service.ts:153`) resolves translations server-side with a documented fallback rule (`pickText`: exact language match, else first available). Selected answers are stored independently of display language (`TestAnswer.selectedOptionId`) and are not touched by the language switch — verified by reading both the hook and the service. Timer/attempt state is untouched (client-side countdown continues; server `expiresAt` never changes on a language switch).
- ⚠️ **Functionally inert for real content**: because 6,269 of 6,271 questions have only a Hindi translation, switching to English on almost any real imported question falls back to showing the same Hindi text again — the mechanism is correct, the content isn't there to demonstrate it.

**Live Test page** (`frontend/app/[locale]/exam/live/[attemptId]/page.tsx` + `use-live-test-attempt.tsx`):
- 🔴 **No language switch exists at all.** Grep for `switchLanguage`/`Language` in both files returns nothing. A student in a Live Test cannot change language.

**Files:** `frontend/hooks/use-test-attempt.tsx`, `frontend/app/[locale]/exam/[attemptId]/page.tsx`, `backend/src/attempts/attempts.service.ts`
**DB models:** n/a (read-path only)
**API routes:** `GET /api/attempts/:id?lang=EN|HI`
**Frontend components:** `exam/[attemptId]/page.tsx` (has it), `exam/live/[attemptId]/page.tsx` (does not)

**Status:** 🟡 PARTIALLY IMPLEMENTED — real, correct implementation for Practice Tests only; absent for Live Tests; practically invisible either way given the bilingual data gap in §4.
**Gap:** No live-test language switch; switch is untestable against real content.
**Risk:** Medium.
**Recommended next action:** Port the same switch mechanism to the live exam page; fix §4 first so there's content to actually switch between.

---

## 6. Practice Test

**Requirement:** available anytime; questions come only from the selected exam's valid syllabus/question pool; backend-enforced.

**Verified:**
- 🟢 "Available anytime" — `AttemptsService.start()` has no scheduling gate for `TestType.PRACTICE` (only `LIVE`-typed `Test` rows check `startAt`/`endAt`, and that's the *legacy* `TestType.LIVE`, not the new `LiveTest` model — see §7 for why these are different things).
- 🔴 **"Only from that exam's valid syllabus/question pool" — not enforced, because it cannot be**: grep across `attempts.service.ts` and `tests.service.ts` for `examId`/`examCycleId`/`StudentExamProfile` returns **zero matches**. Practice test question selection is entirely disconnected from the Exam/StudentExamProfile system built in §1/§2. A student's "My Exams" selection (which doesn't exist in the UI anyway) would have no effect on which practice tests or questions they see even if it did.
- Practice tests today are selected via the pre-existing `Course → TestSeries → TestVolume → Test` hierarchy from the original 45-section build, which has no relationship to `Exam` at all.

**Files:** `backend/src/attempts/attempts.service.ts`, `backend/src/tests/tests.service.ts`
**DB models:** `Test`, `TestQuestion`, `TestAttempt` — no link to `Exam`/`StudentExamProfile`
**API routes:** `POST /api/attempts/start`, `GET /api/tests`
**Frontend components:** `frontend/app/[locale]/(site)/test-series/*`, `frontend/app/[locale]/exam/[attemptId]/page.tsx`

**Status:** 🟡 PARTIALLY IMPLEMENTED — "start anytime" works; "from the selected exam's pool" does not exist in any form.
**Gap:** This is the same root cause as §1's gap — the Exam layer and the content layer were built as two separate systems that were never wired together for the practice-test path (they *are* wired together for Live Tests via `LiveTest.examCycleId`, just not Practice).
**Risk:** High — this is a named, explicit requirement (§6 of the spec) and it does not work today.
**Recommended next action:** Add `examId`/`examCycleId` filtering to the practice-test selection flow once §3's exam-linkage fields exist on `Question`/`Test`.

---

## 7. Live Test

**Requirement:** fixed date/start/end, fixed paper, slot; cannot start early/late; auto-ends.

**Verified — this is the most solid part of the implementation, previously proven end-to-end in the browser:**
- 🟢 `LiveTest` model: `startAt`, `endAt`, `durationMinutes`, `testId` (frozen paper reference), `allowLateEntry`, `lateEntryCutoffAt`, `status`.
- 🟢 `LiveTestStateService.computeStatus()` (`backend/src/live-tests/live-test-state.service.ts`) is a pure function recomputed server-side on every read — never trusts a persisted status column for authorization, only for admin-list display (persisted via a 10-second cron sweep).
- 🟢 `canJoin()` — rejects join attempts before the 1-hour countdown window, rejects after the late-entry cutoff (or `startAt` if late entry disabled), rejects after `endAt`. **This was actually tested live**: e2e test suite (`backend/test/live-test.e2e-spec.ts`) has passing tests for "rejects joining >1hr before start," "rejects joining after end," and "late entrant's expiresAt equals the live test's endAt, never a fresh duration."
- 🟢 Auto-end: `LiveTestsService.sweep()` (10-second cron) auto-submits any still-`IN_PROGRESS` `LiveTestAttempt` once the computed status reaches `ENDED`, reusing `AttemptsService.forceFinalize()` (no duplicate scoring logic).
- 🟢 Real DB evidence of a real run: `live_tests=1`, `live_test_attempts=1` — this is the test live test created and run through end-to-end during the original build+verify pass (subsequently cancelled).

**Files:** `backend/src/live-tests/live-test-state.service.ts`, `live-tests.service.ts`, `live-test-attempt.service.ts`, `backend/test/live-test.e2e-spec.ts`
**DB models:** `LiveTest`, `LiveTestAttempt`
**API routes:** full CRUD + `join`/`submit`/state — see `PHASE_1_API_AUDIT.md`
**Frontend components:** `admin/app/(dashboard)/live-tests/*` (create/edit/list/detail), `frontend/app/[locale]/(site)/live-tests/*` (dashboard + landing/waiting room), `frontend/app/[locale]/exam/live/[attemptId]/page.tsx`

**Status:** 🟢 IMPLEMENTED. This requirement is genuinely done, verified by both code inspection and passing automated tests.
**Gap:** None functional. Missing: `examId` isn't required (optional field, so a Live Test can exist with no exam link, weakening §6's eventual fix); no rank/leaderboard on results (see §15).
**Risk:** Low.
**Recommended next action:** None urgent; make `examCycleId` required once the exam-linkage story is finished, for consistency.

---

## 8. Pre-Exam Countdown

**Requirement:** visible with countdown starting 1 hour before start; server-time-based, not browser clock.

**Verified:**
- 🟢 `LiveTestStateService` — `UPCOMING` before `startAt - 1h`, `COUNTDOWN` from `startAt - 1h` to `startAt`. Matches spec exactly.
- 🟢 `frontend/hooks/use-server-clock.ts` — fetches `GET /api/server-time` once at mount, computes `offset = serverTime - Date.now()`, every countdown renders from `Date.now() + offset`. This is a real server-time sync, not a browser-clock display trick — confirmed by reading the hook.
- ⚠️ **Minor limitation, disclosed honestly:** the offset is fetched **once per page load**, not continuously re-synced. Over a very long session (hours), local clock drift (rare on modern OSes, but not impossible) could introduce a small skew. This is a minor risk, not a fabricated-security claim — the mechanism is genuinely server-time-based, just not continuously re-validated.
- 🟢 Live-tested: this exact behavior (COUNTDOWN badge, live-ticking countdown, transition to LIVE without a manual refresh) was demonstrated working in the browser during the original build.

**Files:** `frontend/hooks/use-server-clock.ts`, `backend/src/system/system.controller.ts`, `backend/src/live-tests/live-test-state.service.ts`
**DB models:** n/a
**API routes:** `GET /api/server-time`
**Frontend components:** `frontend/app/[locale]/(site)/live-tests/[id]/page.tsx`

**Status:** 🟢 IMPLEMENTED.
**Gap:** Offset is not periodically re-synced during a long session (minor).
**Risk:** Low.
**Recommended next action:** None urgent; optionally re-fetch `server-time` every N minutes for very long-lived tabs.

---

## 9. Slot Booking

**Requirement:** admin creates slots, capacity enforced, no race condition, real DB record, status tracked.

**Verified:**
- 🟢 `TestSlot` model: `capacity`, `bookedCount`, `status`. `SlotsService.reserve()`/`bookDirect()` use `updateMany({ where: { id: slotId, bookedCount: { lt: capacity } }, data: { bookedCount: { increment: 1 } } })` inside a `$transaction` — a genuine atomic conditional update, not an app-level check-then-write race.
- 🟢 **Actually tested for the race condition, not just claimed safe**: `backend/test/live-test.e2e-spec.ts` has a passing test that fires two concurrent `slotsService.reserve()` calls at a 1-capacity slot via `Promise.allSettled` and asserts exactly one succeeds. This is real, verified, not theoretical.
- 🟢 `SlotReservation` (temporary hold, `expiresAt`) and `SlotBooking` (confirmed) are separate models with a cron-based expiry sweep (`SlotsService.releaseExpiredReservations`, `@Cron(EVERY_MINUTE)`) that atomically releases the seat.
- 🔴 **Admin frontend: no slot-management UI exists.** `grep -rln "slotsService|TestSlot" admin/app admin/services` returns nothing. An admin can only create a slot via a direct API call (as was done for manual testing), not through any screen.
- 🔴 **Student frontend: no booking UI exists.** Same grep against `frontend/app` returns nothing — `frontend/services/slots.service.ts` exists but is unused. No "My Bookings" page either, despite the backend route (`GET /api/bookings/mine`) existing.
- Real data confirms zero real-world usage: `test_slots=0`, `slot_bookings=0`, `slot_reservations=0`.

**Files:** `backend/src/slots/*`, `backend/test/live-test.e2e-spec.ts`
**DB models:** `TestSlot`, `SlotReservation`, `SlotBooking`
**API routes:** full list in API audit
**Frontend components:** **none** (admin or student)

**Status:** 🟡 PARTIALLY IMPLEMENTED — backend is genuinely solid and race-condition-tested; there is no UI anywhere to use it.
**Gap:** Complete UI absence, both sides.
**Risk:** Medium (backend correctness is proven; the risk is purely "feature is unusable by an actual admin or student today").
**Recommended next action:** Build admin slot-management (nested under a Live Test) and student booking UI.

---

## 10. Subscription Logic

**Requirement:** subscribed → direct booking; not subscribed → payment → verify → booking. Backend-authoritative.

**Verified:**
- 🟢 `EntitlementService.check()` (`backend/src/subscriptions/entitlement.service.ts`) is a real, server-side, live-DB-query choke point — queries `Subscription` for an active, unexpired row, checks `PlanEntitlement` rows, never reads a client-supplied flag.
- 🟢 `SlotsController.reserveOrBook()` (`backend/src/slots/slots.controller.ts`) calls `EntitlementService.check()` **server-side** and branches: entitled → `bookDirect()` (no payment); not entitled → `reserve()` (returns `{requiresPayment: true}`, client must then go through the payment flow). This is genuine backend authorization, not a frontend-only check — confirmed by reading the controller, the decision is made before any response is sent.
- 🔴 **No frontend consumes any of this.** No subscription page, no plan-selection UI, no "you need to pay for this slot" flow rendered anywhere in the student app (see §9's frontend gap — the whole slot-booking UI, subscription-gated or not, doesn't exist).
- Real data: `subscription_plans=0`, `subscriptions=0` — never exercised with real data.

**Files:** `backend/src/subscriptions/entitlement.service.ts`, `backend/src/slots/slots.controller.ts`
**DB models:** `SubscriptionPlan`, `PlanEntitlement`, `Subscription`
**API routes:** `POST /api/slots/:id/reserve` (branches internally), `GET /api/subscriptions/mine`, `GET /api/subscriptions/plans`
**Frontend components:** none in the student app; admin has a plan-CRUD page (`admin/app/(dashboard)/subscriptions/page.tsx`) but it has never been used to create a real plan (0 rows)

**Status:** 🟡 PARTIALLY IMPLEMENTED — the authorization logic is real, correct, and server-side; there is no way for a real user to ever reach it.
**Gap:** No student-facing subscription/entitlement UI at all; `frontend/services/subscriptions.service.ts` doesn't even exist (only the admin one does).
**Risk:** Medium.
**Recommended next action:** Build the student subscription page and wire the slot-booking UI (§9) to actually call `reserveOrBook`.

---

## 11. Payment

**Requirement:** verify real integration vs mock — provider, API, webhook, verification, success/failure, duplicates, booking confirmation.

**Verified:**
- **Provider:** Razorpay, via the official `razorpay` npm package (`backend/src/payments/payments.service.ts` — `new Razorpay({key_id, key_secret})`).
- **Credentials:** 🔴 `backend/.env` has `RAZORPAY_KEY_ID=`, `RAZORPAY_KEY_SECRET=`, `RAZORPAY_WEBHOOK_SECRET=` — **all blank**. `getRazorpayClient()` throws `ServiceUnavailableException` if unset. **Payments cannot process a single real transaction in the current environment.** This is not a mock — it's real integration code pointed at no real account.
- **Order creation:** 🟢 real: `razorpay.orders.create()`, amount computed server-side from `CouponsService.resolveItemPrice()` (never trusts a client-supplied amount).
- **Verification:** 🟢 real HMAC-SHA256 signature check against `razorpayOrderId|razorpayPaymentId`, comparing to `Payment.razorpaySignature` — **actually tested**: `backend/test/app.e2e-spec.ts` has a passing test for "rejects a payment verification with a forged signature," which also confirms the `Payment.status` is set to `FAILED` on a bad signature, not silently ignored.
- **Webhook:** 🔴 **Does not exist.** `grep -n "webhook" payments/*.ts` returns nothing; there is no `/api/payments/webhook` route. The only confirmation path is the client-initiated `POST /api/payments/verify` after Razorpay's checkout.js callback fires — if a user completes payment but closes the tab/loses connectivity before that callback runs, the payment is never reconciled server-side. This is a real reliability gap in any production payment flow, not a hypothetical.
- **Duplicate handling:** 🟢 `verifyPayment()` checks `if (payment.status === PAID) return payment` — idempotent against a repeated verify call for the same order.
- **Booking confirmation after payment:** 🟢 `PaymentsService.fulfillPayment()` branches on `itemType === 'SLOT_BOOKING'` → `SlotsService.confirmReservation()`, otherwise → `grantEnrollment()`. Real, wired code.

**Files:** `backend/src/payments/payments.service.ts`, `backend/test/app.e2e-spec.ts`
**DB models:** `Payment`
**API routes:** `POST /api/payments/orders`, `POST /api/payments/verify`, `GET /api/payments/history`, `GET /api/payments/admin`
**Frontend components:** none found consuming these for slot bookings (no UI reaches this path — see §9/§10); the original course/test-series purchase flow (pre-existing from the 45-section build) does use it.

**Status:** 🟡 PARTIALLY IMPLEMENTED — real integration code, correctly signature-verified and tested, but **not connected to a live payment account** and **missing a webhook backstop**.
**Gap:** No webhook; no live credentials; no UI path for the new slot-booking payment flow specifically.
**Risk:** High if this goes to production without a webhook — checkout-only Razorpay integrations have a known class of "payment succeeded, app never found out" failures.
**Recommended next action:** Add a webhook endpoint before production; obtain and configure real Razorpay keys for a proper staging test.

---

## 12. Notifications

**Requirement:** notification center; DB model; API; frontend UI; unread count; mark-read; real event generation for booking/payment/exam/subscription/profile events.

**Verified:**
- 🟢 DB: `Notification`, `NotificationPreference`, `NotificationRule` — all real, well-indexed models.
- 🟢 API: full CRUD, `unread-count`, `read`/`read-all`, preferences, admin rule management — all real routes.
- 🟢 Frontend: `frontend/components/layout/notification-bell.tsx` is wired into the header, polls `unread-count` every 20s, opens a real dropdown fetching `GET /api/notifications` on open. This is genuinely connected to real data, not a static placeholder.
- 🔴 **Event generation is almost entirely absent.** `grep -rln "NotificationsService" backend/src` returns **only files inside the `notifications/` module itself** — no other module (`payments`, `slots`, `live-tests`, `attempts`, `subscriptions`) ever calls `NotificationsService.create()`. Concretely:
  - Slot booked → 🔴 no notification created.
  - Payment success/failure → 🔴 no notification created.
  - Exam result ready → 🔴 no notification created.
  - Subscription events → 🔴 no notification created.
  - Profile events → 🔴 no notification created.
  - The **only** generation path that exists at all is `NotificationSchedulerService`'s cron sweep for `LIVE_TEST_REMINDER`/`LIVE_TEST_SCHEDULE`, and it only fires if a `NotificationRule` row exists — **`notification_rules` has 0 rows in the live database**, so even that one working path has never actually fired for real.
- Real data confirms this completely: `notifications=0` in the database, despite 16 real `test_attempts` and 3 real `payments` having occurred.

**Files:** `backend/src/notifications/*`
**DB models:** `Notification`, `NotificationPreference`, `NotificationRule`
**API routes:** full list in API audit
**Frontend components:** `frontend/components/layout/notification-bell.tsx` (real UI, connected, just has nothing to show)

**Status:** 🟡 PARTIALLY IMPLEMENTED, trending toward 🔴 for the actual "notifications get created" requirement — the plumbing (model, API, UI) is real; the event-generation logic the spec explicitly asks to be verified is missing everywhere except one unconfigured cron path.
**Gap:** No module actually calls `NotificationsService.create()` on any real event.
**Risk:** High — "notification center" is a named, explicit requirement and it currently cannot ever show a student anything, because nothing ever writes a row.
**Recommended next action:** Add `notificationsService.create()` calls at each real event site (slot confirm, payment verify success/fail, live-test result publish, subscription grant) — this is a small, mechanical fix once decided where each call belongs.

---

## 13. Exam Security (Integrity Monitoring)

**Requirement:** first violation → warning, second → terminate; verify detection points, backend awareness, event recording, bypass resistance.

**Verified — previously demonstrated live in the browser, re-confirmed by code inspection:**
- 🟢 **Detected events**: `frontend/hooks/use-exam-integrity.ts` — `keydown` (matched against a configurable blocked-combo list, default `ctrl+c/v/p/shift+i, f12`), `visibilitychange` (tab switch), `blur` (window blur), `contextmenu` (if `blockTextSelection`). All client-side JS `addEventListener` hooks — there is no browser-native lockdown.
- 🟢 **Backend awareness**: every matched event is POSTed to `POST /api/live-tests/attempts/:attemptId/integrity-events` — the client never locally decides the outcome.
- 🟢 **Server-side counting, not a boolean**: `IntegrityEventService.recordEvent()` (`backend/src/live-tests/integrity-event.service.ts`) does `prisma.examIntegrityEvent.count({ where: { liveTestAttemptId, actionTaken: { in: [WARNING, TERMINATED] } } })` on every call — a real DB query each time, matching the explicit "do not use a simple boolean" requirement from the earlier spec.
- 🟢 **First → WARNING, second → TERMINATED**: verified by a passing e2e test (`live-test.e2e-spec.ts`) that fires two violation events and asserts `action: 'WARNING'` then `action: 'TERMINATED'`, then confirms the underlying `TestAttempt` was force-finalized with the last-saved answer intact and the score correctly computed — **and this exact sequence was also demonstrated live in a real browser session** (screenshot evidence from the original build: "1 warning" badge → second `ctrl+p` → "Your attempt was terminated for a second integrity violation" → result page with score 1.00).
- 🟢 **Cannot bypass by refreshing**: violation count lives server-side (`ExamIntegrityEvent` rows + `LiveTestAttempt.status`), not in browser memory or `localStorage` — a refresh re-fetches the same state. Attempting to re-`join` a `TERMINATED_FOR_VIOLATION` attempt is explicitly rejected (403) in `LiveTestAttemptService.join()`.
- 🔴 **Honest, explicit limitation — disabling JavaScript entirely bypasses detection completely.** This is not a code bug; it's an inherent property of any browser-based (non-lockdown-browser) proctoring system. If JS never runs, no event listener ever fires, no event is ever POSTed, and the exam proceeds with zero monitoring — the server has no independent signal that anything happened. This must be stated plainly: **the current implementation cannot detect or prevent this class of bypass**, and no code change within this architecture (short of requiring a native lockdown browser / server-side webcam proctoring) closes it.
- ⚠️ Related, smaller limitation: devtools opened via mouse-only (not the `ctrl+shift+i` shortcut) — e.g., a browser's own menu → "Inspect" — is not detected, since only the keyboard shortcut is intercepted.

**Files:** `frontend/hooks/use-exam-integrity.ts`, `backend/src/live-tests/integrity-event.service.ts`, `backend/test/live-test.e2e-spec.ts`
**DB models:** `ExamIntegrityEvent`, `IntegrityPolicy`, `LiveTestAttempt`
**API routes:** `POST /api/live-tests/attempts/:attemptId/integrity-events`
**Frontend components:** `frontend/app/[locale]/exam/live/[attemptId]/page.tsx`

**Status:** 🟢 IMPLEMENTED for what a browser-based system can do, with a clearly disclosed and inherent ⚠️ limitation (JS-disabled bypass) that must not be described as "secure" without that caveat.
**Gap:** No detection for JS-disabled clients; no devtools detection via non-keyboard paths; no server-side behavioral signal (e.g., impossibly-fast answering) as a secondary check.
**Risk:** Medium-High if the product is marketed as tamper-proof — it is not, and no client-side-only system can be.
**Recommended next action:** If stronger guarantees are required, that needs a different architecture (lockdown browser, proctoring service) — out of scope for a code fix.

---

## 14. Attempt Model

**Requirement:** records student, test, exam, questions, answers, question state, start/end, submission, score, correct/incorrect/skipped, time spent, violation events where implemented.

**Verified against the actual `TestAttempt`/`TestAnswer`/`LiveTestAttempt` models:**
- 🟢 `userId`, `testId`, `language`, `status`, `startedAt`, `expiresAt`, `submittedAt`, `score`, `correctCount`, `incorrectCount`, `unattemptedCount`, `timeTakenSeconds` — all present on `TestAttempt`.
- 🟢 `TestAnswer`: `selectedOptionId`, `isMarkedForReview`, `isCorrect`, `marksAwarded`, `answeredAt` — per-question state, correctly modeled.
- 🔴 No direct `examId` on `TestAttempt` — exam context, if needed, has to be derived transitively through `Test → TestVolume → TestSeries → Course` (pre-existing hierarchy) or, for Live Tests, through `LiveTest.examCycleId` — there is no single `examId` column on the attempt itself.
- 🟢 `LiveTestAttempt.integrityWarningCount` + the `ExamIntegrityEvent` table — violation events are recorded, as covered in §13.
- 🟢 "Skipped" = `unattemptedCount`, computed correctly server-side in `AttemptsService.finalize()` (the sole place score is ever written, never trusts client input — verified and covered by a passing e2e "tampered score is ignored" test in `app.e2e-spec.ts`).

**Files:** `backend/prisma/schema.prisma:421-469`, `backend/src/attempts/attempts.service.ts`
**DB models:** `TestAttempt`, `TestAnswer`, `LiveTestAttempt`
**Status:** 🟢 IMPLEMENTED, with the caveat that there's no direct exam-level foreign key on the attempt itself (minor, derivable).

---

## 15. Result System

**Requirement:** practice + live results; correct/incorrect/skipped/marks/negative marks/percentage/time/rank-if-implemented/performance-by-subject/performance-by-topic.

**Verified:**
- 🟢 Correct/incorrect/skipped, marks, negative marks, time-taken — all present and server-computed (see §14).
- 🔴 **Percentage** — not stored or computed anywhere; only raw `score` and implicitly-derivable total marks exist. No `percentage` field, no computation found in `AttemptsService` or any frontend result page.
- 🔴 **Rank** — `grep -rn "rank" backend/src -i` returns **zero matches** anywhere in the codebase. Despite `LiveTest.resultVisibility` existing as a concept, there is no rank computation, no leaderboard query, nothing.
- 🔴 **Performance by subject / by topic** — zero implementation. `Question.subjectId`/`topicId` exist, but no query anywhere aggregates a student's correct/incorrect counts grouped by subject or topic. This also means the "recommend weak topics" personalization idea from the spec (explicitly deferred to Phase 2/AI in the spec itself, so its absence here is expected and correct) has no data foundation prepared yet either.

**Files:** `backend/src/attempts/attempts.service.ts`, `frontend/app/[locale]/(site)/result/[attemptId]/page.tsx`
**DB models:** `TestAttempt` (no percentage/rank fields)
**Status:** 🟡 PARTIALLY IMPLEMENTED — the core scoring is solid and correct; percentage, rank, and subject/topic breakdowns (all explicitly named in the spec) do not exist.
**Gap:** Three named sub-requirements entirely missing.
**Risk:** Medium.
**Recommended next action:** Add percentage as a computed/display value (cheap); rank and per-subject/topic breakdowns require new aggregation queries (larger effort).

---

## 16. Admin System

| Feature | Status | Evidence |
|---|---|---|
| Exam management | 🔴 NOT_IMPLEMENTED | Backend `ExamsController` is real and complete; `admin/app/(dashboard)` has no `exams/` directory at all. |
| Exam cycle management | 🔴 NOT_IMPLEMENTED | Same backend, no UI. |
| Syllabus management | 🔴 NOT_IMPLEMENTED | Same. |
| Subject management | 🟢 IMPLEMENTED | `admin/app/(dashboard)/catalog/subjects/` — real, pre-existing from the original build. |
| Topic management | 🟢 IMPLEMENTED | Same page, nested. |
| Question management | 🟡 PARTIALLY_IMPLEMENTED | Single-question create/edit exists nested inside a Test's page (`question-form-dialog.tsx`); no standalone Question Bank browser, no filters by exam/subject/difficulty/status, no bulk actions. |
| Question review | 🔴 NOT_IMPLEMENTED | No `status` field exists on `Question` (§3) — there is nothing to review/approve. |
| Test creation | 🟢 IMPLEMENTED | `admin/app/(dashboard)/tests/*`, `test-series/*` — real, pre-existing. |
| Live test scheduling | 🟢 IMPLEMENTED | `admin/app/(dashboard)/live-tests/*` — full create/edit/publish/cancel, verified working in the browser. |
| Slot management | 🔴 NOT_IMPLEMENTED | No admin UI exists (§9). |
| Subscription management | 🟡 PARTIALLY_IMPLEMENTED | Plan CRUD page exists (`admin/app/(dashboard)/subscriptions/page.tsx`) and is real; never used with real data (0 plans); no way to view/manage individual entitlements beyond the plan level. |
| Payment monitoring | 🟢 IMPLEMENTED | `admin/app/(dashboard)/payments/page.tsx` — real, lists `GET /api/payments/admin`. |
| Notification management | 🟡 PARTIALLY_IMPLEMENTED | `admin/app/(dashboard)/notifications/page.tsx` manages `NotificationRule` definitions (real CRUD); does not manage/view actual sent notifications, and (per §12) nothing ever generates real notifications for it to show anyway. |
| Student management | 🟡 PARTIALLY_IMPLEMENTED | `admin/app/(dashboard)/users/page.tsx` is a basic search/list/role-toggle (107 lines) — no drill-down into a student's attempts, exam profiles, or subscription history. |

**Status overall:** 🟡 PARTIALLY IMPLEMENTED — roughly half of the 12 listed admin capabilities are real and complete (mostly the pre-existing content-management screens plus Live Tests), the other half (everything tied to the new Exam/Question-workflow/Slot systems) has no UI at all despite solid backends.

---

## 17. Legacy Question Migration — Actual Status, Not Assumed

**This section exists specifically because the spec explicitly warns not to assume migration succeeded just because the SQL file exists.**

- **`testmela(gurumantra).sql` (154MB, 36,918 questions) has NOT been imported.** This file was only *analyzed* (see `migration/LEGACY_DATABASE_ANALYSIS.md` and related docs) — a `LegacyIdMap` table was *designed* (`migration/PROPOSED_SCHEMA_ADDITIONS.md`) but the table **does not exist in the database** (`SELECT * FROM legacy_id_map` → `ERROR 1146: Table doesn't exist`). No migration script for this dataset was ever written or run.
- **The 6,271 questions that DO exist in the database came from a different, earlier legacy dataset** (`u255845777_testmeladb`, imported via `backend/prisma/import-legacy.ts` in an earlier phase of this project, before the `testmela(gurumantra).sql` analysis work began). This is a real, working, deterministic-ID, idempotent import script — but it is not the 36,918-question dataset the spec's "known analysis" section describes.
- Real counts, queried directly: **6,271 questions, 26,872 options, 6,274 translations** (5 EN + 6,269 HI) actually in the database right now.
- None of the follow-up review workflows designed in `migration/` (duplicate review, invalid-question review, language classification, question-bank mapping) have been applied to *any* dataset — they exist as design documents and as static analysis output files (`migration/duplicate-groups-full.json` etc.), not as running code or populated review tables.

**Status:** 🔴 NOT_IMPLEMENTED for the `testmela(gurumantra).sql` dataset specifically. 🟢 IMPLEMENTED (and real) for the separate, earlier `u255845777_testmeladb` dataset, which is what's actually in the database today.
**Risk:** High if anyone assumes the 36,918-question analysis translates to 36,918 questions being available in the app — it does not. Zero of those specific questions have been imported.

---

## 18. AI — Confirmed Absent (Correctly, Per Phase 1 Scope)

Verified by search: `grep -rli "openai\|anthropic\|claude\|embedding\|vector\|rag " backend/src backend/package.json frontend/package.json admin/package.json` — **no matches for any AI SDK, API client, or AI-specific dependency.** `package.json` dependency lists were inspected directly, not assumed.

- 🟢 No OpenAI/Claude API integration.
- 🟢 No AI question generation code.
- 🟢 No AI translation code.
- 🟢 No RAG/embeddings/vector DB.
- 🟢 No AI generation workflow/job queue.

**Architecture readiness for Phase 2:** partially there. The `AiGenerationJob` and AI-related `Question` fields (`isAiGenerated`, `isAiVerified`, `status`) were *designed* in `migration/PROPOSED_SCHEMA_ADDITIONS.md` but, per §3, **not applied to the schema**. Adding them later is additive (new columns/models, no restructuring of existing tables) — so the architecture *can* accommodate AI without a rewrite, but the specific fields needed do not exist yet and will need a real migration when Phase 2 starts.

**Status:** 🟢 CORRECTLY ABSENT for Phase 1 scope; 🟡 PARTIALLY READY for Phase 2 (design exists, schema not yet extended).

---

## 19. UI/UX

See `PHASE_1_FRONTEND_AUDIT.md` for the full screen-by-screen REAL/MOCK/HARDCODED/PLACEHOLDER breakdown. Summary: branding/logo/responsive layout are real and consistent (Tailwind + shadcn/ui, inherited from the original 45-section build); the newer Phase-1-specific screens (Live Tests, dashboard tile) are real and API-connected; **My Exams, slot booking, subscription, and any Question-Bank-review UI simply do not exist as screens** — there's nothing to evaluate for them.

---

## 20/21. API and Database Audits

See `PHASE_1_API_AUDIT.md` and `PHASE_1_DATABASE_AUDIT.md` for the complete, itemized breakdowns requested.

---

## 22. Functional Flow Audit

See `PHASE_1_FUNCTIONAL_FLOW_AUDIT.md` for flows A–F traced through actual code, file by file.

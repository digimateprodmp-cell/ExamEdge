# Phase 1 Functional Flow Audit

Read-only. Each flow is traced through the actual files, in call order, noting exactly where it breaks (if it does) rather than describing the intended design.

---

## Flow A: Registration → Profile → Select Multiple Exams → Dashboard

1. `POST /api/auth/register` (`auth.controller.ts` → `auth.service.ts`) — 🟢 real, creates a `User` row with a generated unique `referralCode`.
2. Redirect to `/profile` or `/dashboard` — 🟢 real pages exist and render real user data.
3. **"Select multiple exams" — 🔴 breaks here.** There is no UI control anywhere in the student app that calls `POST /api/student/exams`. The backend endpoint is real and correct (verified in the requirements matrix), but nothing in `frontend/app` renders a form or list that would let a student pick an exam. A newly registered student today has no way to add even one exam, let alone multiple.
4. Dashboard — 🟢 renders, but has no exam-scoped content because step 3 never happened for anyone (0 rows in `student_exam_profiles`).

**Flow A status: breaks at step 3. Steps 1, 2, 4 work in isolation; the flow as a whole cannot be completed by a real user.**

---

## Flow B: Selected Exam → Syllabus → Practice Test → Questions → Submit → Result

1. "Selected exam" — 🔴 doesn't exist per Flow A; even if it did, there is no code path anywhere (`attempts.service.ts`, `tests.service.ts`) that reads a student's selected exam to filter anything (confirmed by grep — zero matches for `examId`/`StudentExamProfile` in either file).
2. "Syllabus" — 🔴 `syllabus_versions`/`syllabus_topics` have 0 rows; even if populated, nothing queries them during practice-test selection.
3. Practice test selection — 🟢 real, but via the **old** `Course → TestSeries → TestVolume → Test` hierarchy, completely independent of "exam."
4. `POST /api/attempts/start` — 🟢 real, creates a `TestAttempt`, verified by a passing e2e test that also confirms server-side scoring can't be tampered with.
5. Questions render — 🟢 real, with a real (if data-starved, per §5 bilingual gap) language switch.
6. Submit — 🟢 real, `AttemptsService.finalize()` is the sole score-writing path, server-authoritative, e2e-tested.
7. Result — 🟢 real for what it shows (no percentage/rank/subject-breakdown, per requirements matrix §15).

**Flow B status: steps 3–7 (the actual test-taking mechanics) genuinely work end to end and are well-tested. Steps 1–2 (the "selected exam's syllabus" framing the spec asks for) do not exist — the practice test a student takes today has no relationship to any exam they might select, because they can't select one, and the content wouldn't be filtered even if they could.**

---

## Flow C: Admin Creates Live Test → Slot → Countdown → Test Starts → Ends → Result

1. Admin creates a Live Test with date/time — 🟢 real, `admin/app/(dashboard)/live-tests/page.tsx` → `POST /api/live-tests`, verified working live in a browser during the original build (screenshot evidence: test-picker populated with real 106 tests, form submitted successfully).
2. Admin configures date/time/late-entry/integrity policy — 🟢 real, all fields wired.
3. **Admin creates a slot — 🔴 breaks here.** No UI exists to call `POST /api/live-tests/:liveTestId/slots` (requirements matrix §9/§16). The backend route is real; nothing in the admin app renders a form for it.
4. Student sees countdown — 🟢 real (this part doesn't depend on slots existing — a Live Test without any slots is still joinable directly), verified live: COUNTDOWN badge, ticking server-synced countdown, transition to LIVE without a manual refresh.
5. Test starts (student joins) — 🟢 real, `canJoin()` correctly gates on the 1-hour window and late-entry rules, e2e-tested.
6. Test ends automatically — 🟢 real, cron sweep auto-submits any still-in-progress attempt at the computed `ENDED` transition, reusing the same scoring path as manual submission.
7. Result — 🟢 real (same caveats as Flow B step 7 — no rank/percentage).

**Flow C status: breaks at step 3 if slot booking is a required part of the flow (the spec's Live Test description includes "Slot" as a required element). If a Live Test is used *without* slots (direct join, which the code fully supports since `LiveTest.slots` is optional), the entire rest of the flow (4–7) works and has been verified live.**

---

## Flow D: Non-Subscriber → Select Slot → Payment → Verification → Booking → Notification

1. "Select slot" — 🔴 breaks immediately. No slot-booking UI exists on the student side (confirmed in Flow C step 3 and requirements matrix §9). There is nothing to click.
2. If reached programmatically (as this audit confirmed by reading the code, not by clicking a UI that doesn't exist): `POST /api/slots/:id/reserve` → `EntitlementService.check()` returns `entitled: false` for a user with no `Subscription` → `SlotsService.reserve()` creates a `SlotReservation` and returns `{requiresPayment: true}` — 🟢 this backend logic is real and correct.
3. Payment — 🟢 `POST /api/payments/orders` with `itemType: 'SLOT_BOOKING'` would resolve the price via `CouponsService.resolveItemPrice()`'s `SLOT_BOOKING` case (added this phase, real code) — **but there is no frontend button/form that constructs this request for a slot specifically.** The pre-existing purchase-flow UI (for courses/test-series) does not know about `SLOT_BOOKING` as an item type.
4. Verification — 🟢 real HMAC check, e2e-tested (for the general payment-verify path, not slot-specific, but the code is itemType-agnostic).
5. Booking confirmation — 🟢 `PaymentsService.fulfillPayment()` correctly branches to `SlotsService.confirmReservation()` for `SLOT_BOOKING` — real, wired code.
6. Notification — 🔴 nothing calls `NotificationsService.create()` on payment success anywhere (requirements matrix §12) — no notification is ever generated for this event, even if steps 1–5 were somehow completed via direct API calls.

**Flow D status: the backend chain (steps 2, 3's server logic, 4, 5) is real and correctly wired end to end. The flow is entirely unreachable by an actual user because step 1 has no UI, and step 6 (notification) never fires regardless.**

---

## Flow E: Subscriber → Select Slot → Entitlement Verification → Booking → Notification

1. "Select slot" — 🔴 same break as Flow D step 1.
2. Entitlement verification — 🟢 `EntitlementService.check()` is real, server-side, queries live `Subscription`/`PlanEntitlement` data, never trusts a client flag — this is genuinely solid code, previously the main design goal of this subsystem.
3. Direct booking — 🟢 `SlotsService.bookDirect()`, same atomic capacity-safe transaction as the paid path, real code.
4. Notification — 🔴 same gap as Flow D step 6.

**Flow E status: same shape as Flow D — backend logic is real and correct, unreachable in practice because no UI exists to select a slot, and no notification fires even server-side-only.**

---

## Flow F: Question → Language Switch → Answer Preservation → Submit → Result

1. Question renders in a chosen language — 🟢 real (`AttemptsService.getForStudent`, server-resolved translation with fallback).
2. Language switch — 🟢 real for Practice (`use-test-attempt.tsx`'s `switchLanguage`), 🔴 does not exist for Live Tests (`use-live-test-attempt.tsx` has no equivalent function — confirmed by grep).
3. Answer preservation across the switch — 🟢 verified by reading the code: `TestAnswer.selectedOptionId` is stored independent of display language and is never touched by the `?lang=` re-fetch; the re-fetch's `answersByTestQuestionId` map is rebuilt from the same underlying `TestAnswer` rows regardless of language param.
4. Submit — 🟢 real, same server-authoritative scoring path as Flow B.
5. Result — 🟢 real, same caveats as before (no percentage/rank).

**Flow F status: works correctly and is well-verified for Practice Tests. Step 2 (the switch itself) is simply absent for Live Tests — a gap in feature parity, not a broken implementation of what exists.**

---

## Cross-Flow Observation

Every flow above breaks (or would break, if attempted by a real user) at the same kind of seam: **a genuinely well-built backend capability with no frontend entry point.** None of the flows fail because of incorrect backend logic — the backend code that exists is, without exception in this audit, correct, server-authoritative, and in the highest-stakes cases (scoring, slot capacity, payment verification, integrity enforcement) actually covered by passing automated tests. The gap is uniformly on the "is there a screen a real user can click through" side.

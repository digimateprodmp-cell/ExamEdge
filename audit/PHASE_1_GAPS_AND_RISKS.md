# Phase 1 Gaps and Risks

Consolidated from the requirements matrix, database/API/frontend audits, and functional flow trace. Ordered by severity, not by discovery order.

## CRITICAL

### 1. Bilingual requirement is not enforced anywhere, and real data proves it
6,269 of 6,271 questions (99.95%) have only a Hindi translation. No DB constraint, backend validation, admin form requirement, or import-time check exists to prevent a single-language question from being fully live and answerable. This was explicitly called CRITICAL in the spec and is the largest, most concretely-evidenced gap in this audit.
**Files:** `backend/src/questions/dto/question.dto.ts`, `backend/prisma/schema.prisma` (`QuestionTranslation`)
**Fix shape:** requires a `status` field (doesn't exist yet — see gap 3) with a `PUBLISHED` transition gated on both translations existing, checked server-side.

### 2. The Exam layer and the actual content/attempt system are two disconnected graphs
`Question`, `Test`, and `TestAttempt` have no relationship to `Exam`/`ExamCycle`/`SyllabusVersion`. A student's exam selection (which itself has no UI — gap 4) would have zero effect on practice-test content even if it existed. This breaks the spec's core "select exam → see that exam's syllabus/questions/tests" narrative at the data-model level, not just the UI level.
**Files:** `backend/prisma/schema.prisma` (`Question`, `Test`, `TestAttempt` models)
**Fix shape:** additive columns (`examId`/`examCycleId`/`syllabusVersionId` on `Question`; `examCycleId` on `Test`) plus query-layer filtering in `AttemptsService`/`TestsService`.

### 3. `Question` has no status/source/review-workflow fields at all
No `DRAFT`/`PENDING_REVIEW`/`PUBLISHED`/`REJECTED` states, no `source` (manual/imported/AI), no `isAiGenerated`/`isAiVerified`. Every question that exists is implicitly and permanently "live." This blocks gap 1's fix, blocks admin question review (a named Phase 1 requirement), and blocks Phase 2's AI-generation gating requirement (AI questions must enter `PENDING_REVIEW`, not publish automatically — impossible without this field existing).
**Files:** `backend/prisma/schema.prisma` (`Question` model)

## HIGH

### 4. Roughly 28 real, tested backend routes have zero frontend consumer
Exams (12 routes), Student Exam Profile (5), Slots (6), most of Subscriptions (5) — all fully implemented, several covered by passing e2e tests (slot-booking race condition specifically), and **completely unreachable by any real user** because no page or admin screen calls them. This is not a "small polish item" — it means core named requirements (multi-exam selection, slot booking, subscription-gated booking) do not exist as usable product features today, despite correct backends.
**Detail:** `PHASE_1_API_AUDIT.md`, `PHASE_1_FRONTEND_AUDIT.md`

### 5. Notifications are never actually generated
The full notification pipeline (model, API, real frontend bell component) exists and is wired correctly — but no module (`payments`, `slots`, `live-tests`, `attempts`, `subscriptions`) ever calls `NotificationsService.create()`. The only generation path is a cron sweep for live-test reminders, gated on `NotificationRule` rows that don't exist (0 rows). Zero notifications have ever been created for a real event, confirmed by `notifications=0` in the database despite 16 real test attempts and 3 real payments having occurred.
**Files:** `backend/src/notifications/*` (isolated), every other module (no calls out)
**Fix shape:** mechanical — add `notificationsService.create()` calls at each real event site once the call sites are decided.

### 6. Payment has no webhook; not connected to a real Razorpay account
The signature-verification code is real and tested, but relies entirely on the client-initiated `/verify` callback firing — there's no server-to-server webhook backstop for the class of failure where a payment succeeds but the browser never reports back. Credentials are also blank in the current environment, so no real transaction can be processed at all right now (expected for a dev environment, but worth stating plainly rather than implying payments "work").
**Files:** `backend/src/payments/payments.service.ts`, `backend/.env`

### 7. "Only from that exam's valid syllabus/question pool" is not enforced for Practice Tests
Named explicitly in the spec (§6). Zero code path filters practice-test question selection by exam. Directly caused by gap 2.

### 8. No rank, no percentage, no subject/topic performance breakdown
All three named explicitly in the spec's Result System requirement. `grep -rn "rank" backend/src` returns zero matches anywhere in the codebase.
**Files:** `backend/src/attempts/attempts.service.ts`

## MEDIUM

### 9. No `SubTopic` model
Spec asks for Subject → Topic → SubTopic (three levels); schema has two.

### 10. Exam-integrity monitoring has an inherent, undisclosed-if-unstated bypass: disabling JavaScript
Not a code defect — a structural property of any non-lockdown-browser proctoring system. Must be communicated honestly to stakeholders as a known limitation, not silently accepted as "secure" because event listeners exist. The server-side counting/enforcement that *does* run (when JS is enabled) is genuinely solid and e2e-tested.

### 11. Live Test has no language switch
Practice Tests have a real, working EN/HI switch; the Live Test exam page has none at all.

### 12. `testmela(gurumantra).sql` (36,918 questions) has not been imported
The 6,271 questions actually in the database came from a separate, earlier legacy dataset. The `LegacyIdMap` table designed for the gurumantra import doesn't exist in the live schema. Anyone assuming the earlier 36,918-question analysis means that data is now in the app would be wrong — this audit exists partly to make that explicit.

### 13. `AttemptsService.finalize()` has no atomic guard against a double-submit race
Low probability (requires a genuine client-side double-fire), but unlike slot booking (which was deliberately hardened and tested), attempt finalization relies on there being effectively one caller per attempt rather than an explicit conditional-update guard.

## LOW

### 14. Server-clock offset is fetched once per page load, not periodically re-synced
Minor drift risk over very long sessions. The mechanism itself is genuinely server-time-based, not a browser-clock trick.

### 15. Question Bank admin UI is nested/minimal, not a standalone browser
No filters by exam/subject/difficulty/status, no bulk actions, no bulk CSV/Excel import despite being named in the original spec.

### 16. Admin Student Management is a thin list/search/role-toggle
No drill-down into a student's attempt history, exam profiles, or subscription status from the admin Users screen.

---

## Risk Summary by Area

| Area | Backend Correctness | Frontend Reachability | Overall Product Risk |
|---|---|---|---|
| Live Test scheduling/join/integrity | High (tested) | High (verified live) | **Low** — this genuinely works |
| Slot booking | High (tested) | **None** | **High** — unusable despite being the best-tested code in the repo |
| Subscription/entitlement | High | **None** | **High** — same pattern |
| Student multi-exam profile | High | **None** | **High** — same pattern |
| Notifications | High (plumbing) | High (bell UI) | **High** — nothing ever populates it |
| Bilingual content | N/A (no enforcement) | Real mechanism, no data | **Critical** — named CRITICAL in spec |
| Payment | High (verify), gap (webhook) | Partial (old flow only) | **Medium-High** for production readiness |
| Exam→content linkage | **Missing at schema level** | N/A | **Critical** — blocks multiple named requirements |

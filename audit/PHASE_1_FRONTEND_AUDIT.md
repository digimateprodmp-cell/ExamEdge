# Phase 1 Frontend Audit

Read-only. Every page listed was opened in the source tree and traced to confirm whether it calls a real backend service, and (where the earlier build session recorded it) whether it was actually exercised in a live browser against the real API. Data classification: **REAL** (calls a live backend endpoint and renders its response) · **MOCK** (calls a stubbed/fake function) · **HARDCODED** (static content baked into the component) · **PLACEHOLDER** (screen doesn't exist, or exists as an empty/stub shell) · **N/A** (screen requested by the audit doesn't exist at all).

No MOCK data was found anywhere in this codebase — every screen that renders data either calls a real API or doesn't exist. This is worth stating plainly since it's a genuine positive finding, not just a list of gaps.

## Branding / Logo / Responsive Design

**REAL.** `frontend/components/layout/logo.tsx`, Tailwind config with a real design-token set (`--primary`, `--secondary`, etc.), `Noto Sans Devanagari` + `Plus Jakarta Sans` font stack for Hindi/English. Verified responsive via the admin `resize_window` checks done during the original build (mobile/desktop breakpoints render correctly). Not re-verified pixel-by-pixel in this audit pass, but the underlying Tailwind setup is real and consistent across `frontend` and `admin`.

## Student Dashboard (`frontend/app/[locale]/(site)/dashboard/page.tsx`)

**REAL**, but thin. Tiles link to `/live-tests`, `/my-coupons`, `/coins`, `/my-test-series`, `/test-series` — all real routes. **No "My Exams" tile or widget** (because the feature has no UI — see requirements matrix §1). **No upcoming-live-test widget, no notification summary, no subscription status** on the dashboard itself (those live on their own pages where they exist at all).

## Exam Selection ("My Exams")

**N/A — does not exist.** `grep -rln "studentProfileService"` across `frontend/app` returns nothing. This screen was never built, despite `frontend/services/student-profile.service.ts` being a complete, correct API client ready to be used.

## Profile (`frontend/app/[locale]/(site)/profile/page.tsx`)

**REAL** for what it has (285 lines, name/email/phone/password fields wired to `usersService`/`authService`). **Missing the "My Competitive Exams" and "Subscription" sections** that the plan called for — confirmed by grep, neither `studentProfileService` nor a subscriptions service is imported here.

## Practice Tests (`frontend/app/[locale]/(site)/test-series/*`, `frontend/app/[locale]/exam/[attemptId]/page.tsx`)

**REAL**, pre-existing from the original build, unchanged this phase. Question rendering, timer, palette, language switch (§5 of requirements matrix) all call real `attemptsService` endpoints. **Not filtered by exam** (see requirements matrix §6 — this is a backend gap, the frontend correctly reflects whatever the backend returns, which today is everything, unfiltered).

## Live Tests (`frontend/app/[locale]/(site)/live-tests/page.tsx`, `[id]/page.tsx`, `frontend/app/[locale]/exam/live/[attemptId]/page.tsx`)

**REAL and verified live in a browser** during the original build: dashboard sections (Live Now/Upcoming/Completed) driven by `liveTestsService.list()`; landing page polls the live-test detail endpoint with tightening cadence near start time and shows a real server-clock-synced countdown; the exam page is a real, working exam UI with a genuine integrity-monitoring hook. This is the most complete and best-verified screen set in the entire new-feature scope. **No language switch on this specific page** (§5) and **no slot-booking entry point** rendered here even though a Live Test can have slots (§9) — a student who reaches a slotted Live Test's landing page currently has no way to see or book a slot from that screen.

## Slot Booking

**N/A — does not exist.** No page anywhere renders `TestSlot` data or calls `reserveOrBook`. `frontend/services/slots.service.ts` is unused.

## Notifications

**REAL**, but showing nothing real yet. `frontend/components/layout/notification-bell.tsx` is a genuine, working component: polls `unread-count` every 20s, opens a real dropdown, calls `markAllRead`. Classified **REAL** because the plumbing is real — but per requirements matrix §12, since nothing server-side ever creates a `Notification` row, this component will show "No notifications yet" for every real user, indefinitely, today.

## Question Interface / Bilingual Display

**REAL mechanism, PLACEHOLDER-equivalent content.** The rendering and language-switch code is real (see §5 of requirements matrix). Because 99.95% of real questions in the database have only a Hindi translation, in practice a student toggling to English sees no change for almost every question — not because the UI is fake, but because there's no English content behind it. Flagging this distinctly from a true placeholder: **the code path is real; the data isn't there.**

## Results (`frontend/app/[locale]/(site)/result/[attemptId]/page.tsx`)

**REAL** for what it shows (score, correct/incorrect/unattempted, per-question review with explanations where they exist) — pre-existing from the original build. **No percentage, no rank, no subject/topic breakdown** rendered, because the backend doesn't compute them (requirements matrix §15) — the frontend isn't hiding anything, there's genuinely nothing to show.

## Admin Interface

Screen-by-screen, verified against `admin/app/(dashboard)/*`:

| Screen | Classification | Notes |
|---|---|---|
| Overview | REAL | Static tile grid linking to real sub-pages (screenshotted during the earlier "run in local" session — genuinely renders). |
| Users | REAL (thin) | List/search/role-toggle only, no drill-down. |
| Subjects & Topics | REAL | Pre-existing, unchanged. |
| Courses | REAL | Pre-existing. |
| Test Series / Tests | REAL | Pre-existing, includes nested question CRUD. |
| Batches | REAL | Pre-existing. |
| Live Tests | REAL, verified live | Full create/edit/publish/cancel flow, test-picker populated with real 106 tests, confirmed working end-to-end in a real browser session. |
| Subscriptions | REAL but empty | Plan CRUD works; 0 real plans exist; no entitlement-management UI beyond plan-level fields. |
| Notification Rules | REAL but inert | Rule CRUD works; 0 real rules exist; and even if rules existed, nothing calls the notification-creation path for the events that matter (§12). |
| Payments | REAL | Pre-existing, lists real `Payment` rows. |
| Coupons / Coins / Content (Notes/Videos/Blogs/Current Affairs) | REAL | Pre-existing, unchanged. |
| **Exams** | **N/A — no page exists** | |
| **Syllabus/SubTopic management** | **N/A — no page exists** | |
| **Question Bank (standalone, with review/status/filters)** | **N/A — no page exists** | |
| **Slot management** | **N/A — no page exists** | |

## Summary

Of the screens this phase specifically added or was supposed to add: **Live Tests (student + admin) is fully real and verified. Notifications UI is real but has nothing to show. Everything else scoped to this phase — My Exams, Slot Booking, Subscription (student side), Exam/Syllabus admin, Question Bank admin — does not exist as a screen at all.** This mirrors the API audit's finding precisely: the backends were built thoroughly; roughly half the corresponding frontends were not.

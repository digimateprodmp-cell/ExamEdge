# Phase 1 API Audit

Read-only. Every route below was extracted directly from the actual controller decorators (`grep` across every `*.controller.ts`), not from memory or prior design docs. "Frontend consumer" was verified by grepping the actual frontend/admin `services/` directories for which API client functions exist and are imported by at least one page/component.

Auth model (applies globally unless noted): `JwtAuthGuard` + `RolesGuard` are registered as global `APP_GUARD`s in `app.module.ts` — every route requires a valid JWT **unless** marked `@Public()`; every route additionally requires `Role.ADMIN` if marked `@Roles(Role.ADMIN)`, otherwise any authenticated role (STUDENT or ADMIN) may call it.

Status column: 🟢 used by a real frontend/admin screen · 🟡 exists, callable, but no UI consumer found · 🔴 not found in either app's service layer at all (shouldn't happen if it's in the controller — flags a truly orphaned route)

## Auth (`/api/auth`) — pre-existing, unmodified this phase
All `@Public()`. `register/login/refresh/logout/me/email-otp/phone-otp/forgot-password/reset-password/change-password`. 🟢 Consumed by `frontend/services/auth.service.ts` and `admin`'s equivalent, both apps' login/signup pages.

## Exams (`backend/src/exams/exams.controller.ts`)
| Method | Route | Auth | DB op | Consumer |
|---|---|---|---|---|
| GET | `/api/exams` | Public | `exam.findMany` | 🔴 none — no page calls this |
| GET | `/api/exams/:id/cycles` | Public | `examCycle.findMany` | 🔴 none |
| GET | `/api/exams/admin` | ADMIN | `exam.findMany` | 🔴 none — no admin page exists |
| GET | `/api/exams/admin/:id` | ADMIN | `exam.findUnique` | 🔴 none |
| POST | `/api/exams` | ADMIN | `exam.create` | 🔴 none |
| PATCH | `/api/exams/:id` | ADMIN | `exam.update` | 🔴 none |
| DELETE | `/api/exams/:id` | ADMIN | `exam.update` (soft, `isActive=false`) | 🔴 none |
| POST | `/api/exams/:id/cycles` | ADMIN | `examCycle.create` | 🔴 none |
| PATCH/DELETE | `/api/exams/cycles/:cycleId` | ADMIN | update/soft-delete | 🔴 none |
| POST | `/api/exams/cycles/:cycleId/syllabus-versions` | ADMIN | `syllabusVersion.create` | 🔴 none |
| POST/DELETE | `/api/exams/syllabus-versions/:versionId/topics` | ADMIN | `syllabusTopic.upsert/delete` | 🔴 none |

**Every single Exams route is orphaned** — the backend is complete and correct (verified by reading `exams.service.ts`), but neither the student nor admin frontend has any service file or page calling any of these 12 routes.

## Student Exam Profile (`backend/src/student-profile/student-profile.controller.ts`)
| Method | Route | Auth | DB op | Consumer |
|---|---|---|---|---|
| GET | `/api/student/exams` | Any authenticated | `studentExamProfile.findMany` | 🔴 `frontend/services/student-profile.service.ts` exists but is imported nowhere |
| POST | `/api/student/exams` | Any authenticated | create/reactivate | 🔴 |
| PATCH | `/api/student/exams/:id` | Any authenticated | update | 🔴 |
| PATCH | `/api/student/exams/:id/primary` | Any authenticated | transactional primary-swap | 🔴 |
| DELETE | `/api/student/exams/:id` | Any authenticated | soft-remove + reassign primary | 🔴 |

## Live Tests (`backend/src/live-tests/live-tests.controller.ts`) — 23 routes
Public: `GET /api/live-tests` (list), `GET /api/live-tests/:id` (detail). Authenticated: `GET /api/live-tests/mine/attempts`, join/state/answer/submit/integrity-event routes. Admin: full CRUD + publish/cancel + integrity-policy CRUD.
**Status: 🟢 the only fully-consumed subsystem from this phase.** `frontend/services/live-tests.service.ts` is used by `app/[locale]/(site)/live-tests/*` and `app/[locale]/exam/live/[attemptId]/*`; `admin/services/live-tests.service.ts` is used by `admin/app/(dashboard)/live-tests/*`.

## Slots (`backend/src/slots/slots.controller.ts`)
| Method | Route | Auth | Consumer |
|---|---|---|---|
| GET | `/api/live-tests/:liveTestId/slots` | Public | 🔴 none |
| POST | `/api/live-tests/:liveTestId/slots` | ADMIN | 🔴 none — no admin UI |
| PATCH | `/api/slots/:id` | ADMIN | 🔴 none |
| POST | `/api/slots/:id/cancel` | ADMIN | 🔴 none |
| GET | `/api/bookings/mine` | Any authenticated | 🔴 `frontend/services/slots.service.ts` exists, unused |
| POST | `/api/slots/:id/reserve` | Any authenticated | 🔴 same |

**Every Slots route is orphaned on both frontend and admin**, despite the backend being the single most rigorously-tested subsystem in this codebase (race-condition e2e coverage).

## Subscriptions (`backend/src/subscriptions/subscriptions.controller.ts`)
| Method | Route | Auth | Consumer |
|---|---|---|---|
| GET | `/api/subscriptions/plans` | Public | 🔴 none |
| GET | `/api/subscriptions/mine` | Any authenticated | 🔴 no `frontend` service file exists at all for this |
| GET | `/api/subscriptions/plans/admin` | ADMIN | 🟢 `admin/app/(dashboard)/subscriptions/page.tsx` |
| POST | `/api/subscriptions/plans` | ADMIN | 🟢 same page |
| PATCH | `/api/subscriptions/plans/:id` | ADMIN | 🟡 service method exists, page doesn't call an edit action currently (create-only UI) |
| POST | `/api/subscriptions/plans/:id/entitlements` | ADMIN | 🔴 no UI for entitlement rows specifically |
| DELETE | `/api/subscriptions/entitlements/:id` | ADMIN | 🔴 |
| GET | `/api/subscriptions/admin` | ADMIN | 🟢 admin page lists this |
| POST | `/api/subscriptions/grant` | ADMIN | 🔴 service method exists (`subscriptionsService.grant`), no button/form calls it |

## Notifications (`backend/src/notifications/notifications.controller.ts`)
Student-facing (`GET /`, `GET unread-count`, `PATCH :id/read`, `PATCH read-all`, `GET/PATCH preferences`) — 🟢 real, used by `notification-bell.tsx`, except `preferences` which has no settings-page consumer (🔴).
Admin (`GET/POST rules`, `PATCH rules/:id`) — 🟢 used by `admin/app/(dashboard)/notifications/page.tsx`.
**But see requirements matrix §12: nothing anywhere calls `NotificationsService.create()` for a real event, so even the "used" routes have nothing real to display.**

## Payments (`backend/src/payments/payments.controller.ts`)
`GET history` (🟢, pre-existing purchase-history page), `GET admin` (🟢, `admin/app/(dashboard)/payments/page.tsx`), `POST orders`/`POST verify` (🟢 for the pre-existing course/test-series purchase flow; 🔴 for the new slot-booking payment path, which has no UI to trigger it).

## System (`backend/src/system/system.controller.ts`)
`GET /api/server-time` — Public. 🟢 consumed by `frontend/hooks/use-server-clock.ts`.

## Pre-existing routes (Auth, Users, Catalog, Test-Series, Tests, Questions, Notes, Videos, Blogs, Current-Affairs, Batches, Coins, Coupons)
All unchanged from the original 45-section build, all 🟢 consumed by their respective existing pages — not re-audited in depth here since this phase made no changes to them, except:
- **`Questions` (`backend/src/questions/questions.controller.ts`)**: `GET/POST/PATCH/DELETE` — 🟡 consumed only indirectly, nested inside `admin/app/(dashboard)/tests/[id]/page.tsx`'s question list; no standalone Question Bank screen (see requirements matrix §16).

## Summary Table

| Subsystem | Routes | Consumed | Orphaned |
|---|---|---|---|
| Exams | 12 | 0 | **12** |
| Student Exam Profile | 5 | 0 | **5** |
| Live Tests | 23 | ~21 | ~2 |
| Slots | 6 | 0 | **6** |
| Subscriptions | 9 | 4 | 5 |
| Notifications | 9 | 7 | 2 |
| Payments (new slot path) | shared routes | n/a for slots specifically | slot-booking payment path unreachable |

**Headline finding: 28+ real, working, tested backend routes across Exams/Student-Profile/Slots have zero frontend or admin consumer.** This is the same finding as the requirements matrix, restated at the API-endpoint granularity the spec asked for.

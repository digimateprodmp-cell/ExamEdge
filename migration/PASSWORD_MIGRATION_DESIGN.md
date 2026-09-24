# Legacy Password Migration Design (Task 6)

Status: **design only. No user has been imported. No auth code changed.**

## Why legacy passwords cannot be reused (confirmed, not assumed)

Sample `users.password` value from the dump:
```
eyJpdiI6IjhqN0lLazc4YVMrZmdnYWFENFNFOFE9PSIsInZhbHVlIjoieEpLT0RNZmFyd21HSGlXWnZWUW9JdytETUg4aVkwdWgzNUFZZGpmM2Z1TT0iLCJtYWMiOiI4MmIzNTgzYzk0ZjkzMWJkZTU1MzAyMjI4YTg0MjYwZjU4MmYyNDM3M2Q3ZWI3YTM0NTUyOGQzZjcwZDAwNmZiIn0=
```
Base64-decoding this yields a JSON envelope with `iv`/`value`/`mac` keys — the exact shape of Laravel's `Crypt::encrypt()` (AES-256-CBC + HMAC), which itself wraps the actual bcrypt hash. Recovering the underlying bcrypt hash requires the legacy application's `APP_KEY` (not present anywhere in this SQL dump, and not something this task has access to even if it existed). Our new auth system (`AuthService`, bcrypt-based, per the existing `backend/src/auth` module) expects a plain bcrypt hash in `User.passwordHash` — these values cannot be placed there directly, encrypted or not, without first successfully decrypting them, which is outside what this migration can or should attempt. **This is a structural fact about the data, confirmed by inspecting a real sample, not a policy choice.**

## Flow

```
Legacy Laravel `users` row
        │
        ▼
  User imported (name, email, phone, role, isEmailVerified, isPhoneVerified, etc. — real fields copied)
  passwordHash = an unusable sentinel value (see below), never a real hash
  passwordMigrationRequired = true   (new field, see below)
        │
        ▼
  User attempts to log in with their old password
        │
        ▼
  AuthService.login() checks passwordMigrationRequired BEFORE comparing any password
        │
        ▼
  Response: "Your account was migrated to our new system — please reset your
  password to continue" + triggers the SAME forgot-password flow that already
  exists (VerificationToken with purpose=PASSWORD_RESET, OTP/link sent to the
  user's verified email or phone)
        │
        ▼
  User completes the existing reset-password flow
        │
        ▼
  New AuthService.resetPassword() writes a real bcrypt hash via the existing
  bcryptjs-based path, and sets passwordMigrationRequired = false
        │
        ▼
  User logs in normally from this point on, indistinguishable from a
  never-migrated account
```

## Schema delta

No new model needed — the existing `VerificationToken` model (with `VerificationPurpose.PASSWORD_RESET` already defined) is reused as-is. One additive field on `User`:

```prisma
// additive field on the existing User model:
//   passwordMigrationRequired   Boolean   @default(false)
```

Every migrated legacy user gets `passwordMigrationRequired = true` at import time; every freshly-registered user (via the new platform's own signup) never touches this field and stays at the default `false`.

**`User.passwordHash` for a migrated row** is set to a bcrypt hash of a cryptographically random value that is generated once and discarded (never logged, never stored anywhere else) — not left null (the column is `NOT NULL` in the current schema) and not set to a guessable placeholder like `"MIGRATED"` that could theoretically be brute-forced against. This guarantees the account is unauthenticatable by password until the reset flow runs, without weakening the `NOT NULL` constraint.

## Historical data stays attached (the actual point of this task)

Because migration always goes through `User.id` (new cuid) ↔ `users.id` (legacy bigint) via `LegacyIdMap`, every other migrated table that references `userId`/`uId` resolves through the same lookup — the user identity is established once, and everything else hangs off it normally:

| Legacy table | Stays associated via |
|---|---|
| `results` → `TestAttempt` | `results.userId` → `LegacyIdMap` → `TestAttempt.userId` |
| `examanswers` → `TestAnswer` | via the parent `TestAttempt`, same lookup |
| `csenrolls`/`tsenrolls`/`praenrolls`/`ptsenrolls`/`batchenrolls` → `Enrollment` | `*.uId`/`*.userId` → `LegacyIdMap` |
| `purchasecourses`/`purchasetests`/`purchasebatches`/etc. → `Payment` | `*.userId` → `LegacyIdMap` |
| `purchasepackages` → `Subscription` (if the product decision in `LEGACY_TO_NEW_MAPPING.md` goes that way) | same |

None of this requires the user to have reset their password yet — historical data migrates and attaches to the `User` row at import time, independent of and prior to any login attempt. A migrated user who never logs in again still has a complete, correctly-attributed history in the new system.

## What still needs a decision (not resolved here)

- **Notification delivery for the reset prompt**: the existing `NOTIFICATION_TRANSPORT` config (console/SMTP) needs a real SMTP provider configured before migrated users can actually receive a reset email at scale — this is an ops/infra readiness item, not a code design gap.
- **A large majority of legacy users have no verified contact channel at all — this is a real blocker, quantified, not a footnote.** Pulling the actual verification flags from all 4,332 `users` rows:

  | | Count | % |
  |---|---|---|
  | Email verified only | 5 | 0.1% |
  | Phone verified only | 329 | 7.6% |
  | Both verified | 127 | 2.9% |
  | At least one verified | 461 | 10.6% |
  | **Neither verified** | **3,871** | **89.3%** |

  Nearly 9 in 10 migrated accounts have no confirmed email or phone on file, meaning the existing OTP/link-based `VerificationToken` reset flow — which sends to a *verified* contact — cannot reach them. This is not a small edge case to patch later; it affects the large majority of the user base and **must be resolved with an explicit product decision before any user-facing password migration goes live.** Realistic options, none chosen here:
  1. Send the reset link to the on-file (unverified) email/phone anyway, accepting the risk that some are stale/wrong, and let delivery failure be the natural filter.
  2. Require manual, admin-assisted identity verification for the 3,871 unverified accounts (support-ticket-driven, doesn't scale automatically).
  3. Treat unverified legacy accounts as requiring fresh signup rather than migration — i.e. their historical data migrates and stays attached (per the table above), but the *account itself* isn't usable until the person re-registers with a real, newly-verified contact method, at which point their existing `User.id` is claimed rather than a new one created.

  Option 3 is the safest from a security standpoint (never sends anything to an unverified/possibly-wrong contact) but has the roughest UX. This needs the product owner's call, not an assumption baked into the importer.
- **`users.type = 'QA'` accounts** (flagged as ambiguous in `AMBIGUOUS_AND_UNMAPPED_TABLES.md`) — go through the same password-reset flow regardless of role once their `Role` mapping is decided, no special-casing needed here.

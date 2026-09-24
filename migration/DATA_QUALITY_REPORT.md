# Data Quality Report — `testmela(gurumantra).sql`

Generated from a scripted, full-file pass over the dump (not a sample/estimate, except where explicitly marked). See `LEGACY_DATABASE_ANALYSIS.md` for full methodology and table-by-table detail — this document is the condensed, action-oriented view: what's wrong, how much of it, and what to do about each issue.

> **Update:** the four rows marked "sample scan" below were superseded by a full, proper state-machine SQL parse run for Tasks 3/4/5 of the follow-up review-workflow phase. The corrected, validated numbers are **7** invalid-`correctAns` rows (not 4), **41** invalid-`qType` rows (not 39), **580 duplicate groups / 1,201 rows** using a question-*and*-options signature (not 2,180/2,836, which was text-only and produced false positives from shared boilerplate question stems — see `DUPLICATE_REVIEW_DESIGN.md`), and a refined 5-state language split with **7,915 questions (21.5%)** identified as cleanly auto-splittable `BILINGUAL` content, not just lumped into "mixed" (see `LANGUAGE_CLASSIFICATION_DESIGN.md`). The rows below are left as originally written, for a record of what the first-pass estimate looked like, but treat the linked follow-up documents as authoritative.

## Question Bank (`questions`, 36,918 rows)

| Issue | Count | Severity | Recommended handling |
|---|---|---|---|
| `correctAns` index out of range for `totalOptions` | 4 in the original sample scan; **corrected to 7 real rows with actual qIds** — see `INVALID_QUESTION_REVIEW_DESIGN.md` | High — question cannot be scored | Exclude from import, list explicitly in the report, do not default to option 1 |
| `totalOptions` < 4 (1, 2, or 3 options) | 23 rows (1+16+6) | Medium — likely bad data entry for a single-choice exam question | Flag for manual review before import, don't auto-exclude (a 2-option True/False-style question may be legitimate) |
| Invalid `qType` (literal `'0'` instead of `'radio'`) | 39 in the original sample scan; **corrected to 41 real rows with actual qIds** — see `INVALID_QUESTION_REVIEW_DESIGN.md` | Medium | Exclude or default to `SINGLE_CHOICE` only after manual spot-check confirms these are genuinely single-choice, not a different broken type |
| Exact duplicate question text (same normalized hash) | 2,180 groups / 2,836 rows in the original text-only sample scan; **corrected to 580 groups / 1,201 rows using a question+options signature, including 15 groups with conflicting correct answers** — see `DUPLICATE_REVIEW_DESIGN.md` | Low-Medium — wastes question-bank space, not incorrect data | Tier-1 duplicate handling in the migration plan — skip with logging, never silent |
| No explanation (`qHint IS NULL`) | ~39% of rows (sample scan: 12,550 of 31,873 counted) | Low — pre-existing gap, not a migration defect | Migrate as `explanation: null`; not a blocker |
| `marks = 0.00` | 6 rows | Low | Flag for review — a correct answer worth zero marks is very likely a config mistake, not intentional |
| Mixed-language content (Hindi + English in one field) | 15,491 of 36,879 (42%) in the original 3-bucket scan; **refined into a 5-state classification: 11,511 HINDI, 10,114 ENGLISH, 7,915 BILINGUAL (cleanly auto-splittable), 7,338 MIXED (needs review), 1 UNKNOWN** — see `LANGUAGE_CLASSIFICATION_DESIGN.md` | Structural, not a "defect" per se | No language column exists to resolve this cleanly — see `QUESTION_MIGRATION_PLAN.md` §6 for the detection/default strategy; every mixed row is flagged in the report for optional admin review, not silently classified |

## Schema-Level Issues (affect every table, not just questions)

| Issue | Impact |
|---|---|
| **Zero `FOREIGN KEY` constraints anywhere in the 70-table schema** | Every relationship in the mapping doc is inferred from column-naming convention and spot-checked against sample data — none is guaranteed by the database itself. A full-file referential-integrity pass (orphaned `qId`/`testId`/`userId` references) has not yet been run and should be step one of the actual migration, not assumed clean. |
| Inconsistent user-reference column naming (`userId` vs `uId` vs `createdBy` vs `qwCreatedBY`) | No functional risk once the importer explicitly maps each table's actual column name (already done in the mapping doc) — flagged so nobody writing the importer assumes a single convention. |
| Inconsistent `created_at`/`updated_at` column *order* across tables | If any future tooling parses `INSERT` value lists positionally instead of via the explicit column list in each statement, this will silently swap timestamps. The recommended scratch-DB-import approach (§2 of the migration plan) sidesteps this entirely since real MySQL always binds by column name. |
| No shared status-value lookup table | Every `tinyint` status/type flag (`qStatus`, `tStatus`, `ccType`, `users.type`, etc.) has its meaning defined only in the original Laravel PHP source, not the database. Several are flagged as ambiguous in `LEGACY_DATABASE_ANALYSIS.md` §5 and must be confirmed, not assumed, before their mapping is finalized. |

## Passwords

`users.password` values are not plain bcrypt hashes — they're a base64-encoded JSON envelope (`{"iv":...,"value":...,"mac":...}`), consistent with Laravel's `encrypt()` helper wrapping the hash with the app's own `APP_KEY`. **These cannot be reused as-is by the new bcrypt-based auth system even if the Laravel `APP_KEY` were available** — reusing them would require replicating Laravel's exact AES-CBC + HMAC scheme just to decrypt down to the original bcrypt hash, which is a security-sensitive amount of extra complexity for a one-time migration. **Recommendation: every migrated user is created with an unusable placeholder password hash and must complete a forced password-reset before first login.** This is treated as a hard requirement, not a nice-to-have, given it touches account security.

## What Full Validation Still Requires (not yet done — this is analysis, not migration)

The SQL validation queries in `QUESTION_MIGRATION_PLAN.md` §3 (orphaned `qtId`/`qwId`, `sqtId`-vs-`parentQtId` consistency, exact `JSON_LENGTH` vs `totalOptions` mismatch count) have not been run against a real MySQL instance yet — the counts above marked "sample scan" come from a streaming Node script over the raw text, which is good enough to size the problem for planning purposes but is explicitly not the final, authoritative count. The actual migration's Phase 5/6 (import a controlled sample, validate) is where these numbers get confirmed exactly, per the development order the spec itself lays out.

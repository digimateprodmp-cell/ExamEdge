# Invalid Question Review Design (Task 4)

Status: **the actual invalid rows have been extracted from the dump with real legacy IDs — not estimated. Nothing has been auto-corrected or imported.**

## Correction to the earlier estimate

The analysis phase's counts (4 invalid-answer, 39 invalid-qType) were from a quick sample scan and are superseded by this task's full, proper parse of all 36,879 rows:

| Issue | Earlier estimate | Actual count (this pass) |
|---|---|---|
| `correctAns` out of range for `totalOptions` | 4 | **7** |
| `qType` not `radio`/`checkbox` | 39 | **41** |

Both datasets are real, extracted with the same state-machine SQL row-parser used for the duplicate-group analysis, and saved in full: [`invalid-answer-rows.json`](./invalid-answer-rows.json) (7 rows), [`invalid-qtype-rows.json`](./invalid-qtype-rows.json) (41 rows).

## Queue 1: Invalid Correct Answer (7 real rows)

| Legacy qId | Current `correctAns` | `totalOptions` | Detected problem | Possible correction (unconfirmed) |
|---|---|---|---|---|
| 13171 | `5` | 4 | Index exceeds option count by 1 | No safe guess — could be a genuine 5th option that got dropped, or a typo for any of 1–4. **Requires the original source material to confirm, not a guess.** |
| 15970 | `0` | 4 | `0` is not a valid 1-based index | Most likely the answer was simply never set (a default/empty value that happens to render as `0`) rather than a typo. Needs the question re-answered from source, not corrected numerically. |
| 17086 | `22` | 4 | Two digits, looks like a doubled keystroke | Plausible correction: `2` (if `22` is `2` typed twice) — **not applied**, flagged for confirmation. |
| 17707 | `33` | 4 | Same doubled-digit pattern | Plausible correction: `3` — **not applied**. |
| 17719 | `22` | 4 | Same doubled-digit pattern | Plausible correction: `2` — **not applied**. |
| 17727 | `33` | 4 | Same doubled-digit pattern | Plausible correction: `3` — **not applied**. |
| 20188 | `24` | 4 | Two-digit value, ambiguous (could be `2` or `4` mistyped together, unlike the clean doubled-digit cases above) | **No confident correction offered** — genuinely ambiguous, must go to a human with the source material. |

Five of the seven share an unmistakable pattern (`22`, `33`, `33`, `22` — a digit typed twice), strongly suggesting a UI/data-entry bug in the legacy admin panel rather than five independent mistakes. That's a useful signal for the admin doing the review (start with these, they're likely fast to confirm), but it is explicitly **not** treated as confirmed — the "possible correction" column is a suggestion surfaced to a human, never auto-applied.

## Queue 2: Invalid Question Type (41 real rows)

All 41 have `qType = '0'` (a literal zero, not one of the two real values `radio`/`checkbox` found anywhere else in the table). Full list in [`invalid-qtype-rows.json`](./invalid-qtype-rows.json); first few for illustration:

| Legacy qId | Current `qType` | Detected problem | Possible correction (unconfirmed) |
|---|---|---|---|
| 695 | `0` | Not `radio`/`checkbox` | Every one of these 41 rows has `totalOptions >= 2` and a single numeric `correctAns` (single-choice shape) — suggested correction: `radio`. Not applied without confirmation, since a genuinely different original intent (e.g. these were meant to be `checkbox` multi-select and the type got lost) can't be ruled out from data shape alone. |
| 696 | `0` | " | " |
| 1006 | `0` | " | " |
| 1786 | `0` | " | " |
| 2290 | `0` | " | " |
| *(36 more, see file)* | | | |

Interesting note: rows 695/696 have **identical question text** ("इनमे से किसकी अवधि 27 कड़ोर से 22 कड़ोर है") — this pair also shows up as a genuine near-duplicate candidate, worth cross-referencing against the duplicate-review queue (Task 3) rather than treated as two unrelated problems.

## Review Data Structure

```prisma
enum InvalidQuestionIssueType {
  INVALID_CORRECT_ANSWER
  INVALID_QUESTION_TYPE
}

enum InvalidQuestionDecision {
  UNRESOLVED
  APPROVED_WITH_CORRECTION  // admin confirmed the suggested (or their own) correction
  REJECTED                  // admin decided this question should not be imported at all
}

model InvalidQuestionReview {
  id             String                    @id @default(cuid())
  legacyId       String                    // qId
  issueType      InvalidQuestionIssueType
  currentValue   String                    // the raw invalid value, e.g. "22" or "0"
  detectedProblem String                   @db.Text
  suggestedCorrection String?              // nullable — some rows (e.g. qId 15970, 20188) have no confident suggestion
  decision       InvalidQuestionDecision   @default(UNRESOLVED)
  appliedCorrection String?                // set only once an admin explicitly confirms — may differ from suggestedCorrection
  decidedById    String?
  decidedBy      User?                     @relation(fields: [decidedById], references: [id])
  decidedAt      DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([legacyId, issueType])
  @@map("invalid_question_reviews")
}
```

## Workflow

1. Both queues (48 rows total: 7 + 41) are seeded into `InvalidQuestionReview` before any import attempt touches these specific `qId`s.
2. Import for these 48 legacy questions is **held** — their `QuestionMigrationRecord.status` (see `MIGRATION_STATUS_DESIGN.md`) is set to `INVALID_CORRECT_ANSWER` or `INVALID_QUESTION_TYPE` and they do not get a `Question` row created yet.
3. Admin UI (spec'd, not built): each queue shown as a simple table — legacy ID, rendered question, current (bad) value, detected problem, suggested correction if one exists, and an input for the admin's own final value (which may or may not match the suggestion).
4. On `APPROVED_WITH_CORRECTION`: the question re-enters the normal import pipeline with the admin-supplied value substituted for the bad one — this is the only path by which these values ever change, and it's logged (`appliedCorrection`, `decidedById`, `decidedAt`) permanently.
5. On `REJECTED`: `QuestionMigrationRecord.status` moves to `REJECTED` — the row is never imported, but the review record (and the fact that a human looked at it and said no) persists forever, satisfying "do not silently discard."

No correction has been applied to any of these 48 rows. Both datasets exist purely as review input.

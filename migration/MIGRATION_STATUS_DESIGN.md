# Migration Status Design (Task 2)

Status: **design only — not implemented, no schema change applied.**

Every legacy question, once touched by the importer, must be traceable forever — whether it succeeded, failed, or is waiting on a human decision. This document proposes the `QuestionMigrationRecord` model that carries that state, additive to `PROPOSED_SCHEMA_ADDITIONS.md`'s already-proposed `LegacyIdMap`.

## Why not just `LegacyIdMap` alone

`LegacyIdMap` (already proposed) answers "what did legacy id X become?" — but only for rows that were successfully created. It has no room for a question that was **rejected**, **pending a mapping decision**, or **flagged for duplicate review** — those rows have no `newId` yet, sometimes never will. A separate status record is needed that exists independently of whether a `Question` row was ever created.

## Proposed model

```prisma
enum QuestionMigrationStatus {
  IMPORTED                  // clean import, no issues
  IMPORTED_WITH_WARNING     // imported, but something needs eyes (e.g. mixed-language, low-confidence duplicate)
  PENDING_MAPPING           // blocked on the 55-row question-bank -> Exam mapping (Task 1)
  DUPLICATE_REVIEW          // held for the duplicate-group review workflow (Task 3)
  INVALID_CORRECT_ANSWER    // correctAns out of range for totalOptions
  INVALID_QUESTION_TYPE     // qType is not a recognized value
  LANGUAGE_REVIEW_REQUIRED  // language classification (Task 5) couldn't confidently resolve
  REJECTED                  // admin explicitly rejected — will never be imported
}

model QuestionMigrationRecord {
  id              String                   @id @default(cuid())
  legacySource    String                   // e.g. "testmela_gurumantra"
  legacyTable     String                   // "questions"
  legacyId        String                   // qId, as a string
  status          QuestionMigrationStatus
  questionId      String?                  // set once a Question row actually exists; null while PENDING/REJECTED
  question        Question?                @relation(fields: [questionId], references: [id])
  migrationError    String?                @db.Text  // hard failure detail, if any
  migrationWarnings Json?                            // array of warning strings, e.g. ["mixed_language_detected", "no_explanation"]
  reviewedById    String?
  reviewedBy      User?                    @relation(fields: [reviewedById], references: [id])
  reviewedAt      DateTime?
  reviewNotes     String?                  @db.Text

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([legacySource, legacyTable, legacyId])
  @@index([status])
  @@map("question_migration_records")
}
```

**One row per legacy question, created on first encounter, updated as it moves through the pipeline — never deleted.** This is the single source of truth for "what happened to legacy question 12345," queryable directly by an admin without cross-referencing multiple tables.

## Status transitions

```
                         ┌────────────────────┐
                         │   row first seen    │
                         └──────────┬──────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
     correctAns invalid   qType invalid      question-bank mapping
                 │                  │        not yet confirmed (Task 1)
                 ▼                  ▼                  ▼
     INVALID_CORRECT_ANSWER  INVALID_QUESTION_TYPE  PENDING_MAPPING
                 │                  │                  │
                 │                  │      (admin confirms mapping)
                 │                  │                  ▼
                 │                  │         ┌── duplicate check ──┐
                 │                  │         │                     │
                 │                  │    no dup found          dup found
                 │                  │         │                     │
                 │                  │         ▼                     ▼
                 │                  │  clean import?         DUPLICATE_REVIEW
                 │                  │    │        │                 │
                 │                  │   yes    warnings              │
                 │                  │    │        │       (admin resolves: KEEP/MERGE/ARCHIVE)
                 │                  │    ▼        ▼                 │
                 │                  │ IMPORTED  IMPORTED_WITH_WARNING│
                 │                  │                                │
                 │                  │            ┌───────────────────┘
                 │                  │            ▼
                 │                  │   proceeds to IMPORTED / IMPORTED_WITH_WARNING
                 │                  │
                 └──────────┬───────┘
                            ▼
                 (admin reviews via Task 4 queue)
                    │                  │
              admin approves      admin rejects
              a correction              │
                    │                   ▼
                    ▼               REJECTED (terminal —
        re-enters the pipeline       never imported,
        at duplicate-check step       stays visible for audit)
```

`LANGUAGE_REVIEW_REQUIRED` (Task 5) can attach to a row in the `IMPORTED_WITH_WARNING` state — it's a warning flag, not a blocking gate, since a question with ambiguous language classification is still scoreable and usable, just needs a human to eventually confirm/split its translations.

## What "do not silently discard" means concretely here

Every one of the 36,918 legacy questions gets exactly one `QuestionMigrationRecord` row after the first pipeline run, no exceptions. The count of rows in this table must always equal 36,918 (plus any future re-runs against new legacy sources) — if it doesn't, that's a bug in the importer, not an acceptable gap. The dashboard (Task 7) reads its numbers directly from `GROUP BY status` on this table, so the two are always consistent by construction, not by two separately-maintained counters that could drift apart.

## Idempotency

Same mechanism as `LegacyIdMap`: `(legacySource, legacyTable, legacyId)` is unique. A re-run of the importer always does a `findUnique` on that triple first — if a record exists, its current `status` is read and the pipeline resumes from there (e.g. a row sitting in `PENDING_MAPPING` gets re-evaluated once the mapping is confirmed, rather than being re-inserted as a duplicate record). This is what makes `npm run migrate:legacy` safe to run repeatedly, per the original spec's Task/rule 33.

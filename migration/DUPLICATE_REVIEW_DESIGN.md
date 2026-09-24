# Duplicate Question Review Design (Task 3)

Status: **design + real duplicate-group data generated. Nothing deleted, nothing imported.**

## Correction to the earlier estimate

The analysis phase's quick regex scan reported **2,180 duplicate groups / 2,836 rows**, based on normalized *question text alone*. Building the actual duplicate-group dataset for this task exposed why that number is unreliable: the single largest "duplicate" cluster was 48 different questions that all share the boilerplate Hindi stem *"इनमें से कौन सा कथन असत्य है?"* ("Which of these statements is false?") — a common exam-question template, not the same question repeated. Text-only matching was flagging template reuse as duplication, exactly the trap the original task instructions warned about ("do not simply use question text as the only unique identifier").

**Corrected methodology:** hash `normalize(question_text) + '::' + normalize(all_option_text, in key order)`. Two rows only match if both the question *and every option* are the same after HTML-stripping/whitespace-normalization. Run against all 36,879 successfully-parsed question rows (31,550 of which had option JSON that parsed cleanly — see caveat below):

| Metric | Value |
|---|---|
| Duplicate groups (question + options both match) | **580** |
| Total rows involved | **1,201** |
| Groups where members disagree on `correctAns` despite identical question+options | **15** — a real content-integrity issue, not just redundancy (see below) |
| Rows where the options JSON could not be parsed by this pass (excluded from this duplicate check, not lost data) | 5,329 (14.4%) — nested HTML-attribute quote-escaping inside the options JSON defeated the quick parser used for this analysis; a production-grade import (restoring into a real MySQL scratch DB, per `QUESTION_MIGRATION_PLAN.md` §2) would parse these correctly via `JSON_LENGTH`/`JSON_EXTRACT` instead of hand-rolled unescaping |

Full dataset: [`duplicate-groups-full.json`](./duplicate-groups-full.json) (580 groups, every member's `qId`/`qwId`/`qtId`/`correctAns`/`totalOptions`). First 15 (by group size): [`duplicate-groups-sample.json`](./duplicate-groups-sample.json).

**The 15 conflicting-answer groups are the most actionable finding here** — these are pairs/sets of legacy rows with byte-identical question and options text but a *different* marked correct answer. Example (real data, `duplicate-groups-full.json`):

```
"किस पुरस्कार से सम्मानित भारतीय एथलीट ईशर सिंह देयोल का निधन हो गया है ?"
  qId=2930  correctAns=4
  qId=2931  correctAns=3
```

Two students who saw this question in different tests could have been scored against opposite "correct" answers. This needs a human to determine which (if either) is right — it's flagged, not auto-resolved, per the task's explicit rule.

## Duplicate Group data structure

```prisma
enum DuplicateReviewDecision {
  UNRESOLVED
  KEEP        // not actually a duplicate — both/all rows imported independently
  MERGE       // genuine duplicate — one canonical Question kept, others linked as aliases
  ARCHIVE     // duplicate confirmed, weaker copy archived (status ARCHIVED), not deleted
}

model QuestionDuplicateGroup {
  id                String   @id @default(cuid())
  signatureHash      String  // the question+options normalized hash
  similarityReason   String  // "EXACT_TEXT_AND_OPTIONS" | "FUZZY_TEXT_MATCH" (tier 2, see below)
  memberLegacyIds     Json    // ["2930","2931",...] — legacy qIds, always populated
  memberQuestionIds  Json?    // new Question.id[] — populated once those rows are imported
  hasAnswerConflict  Boolean @default(false) // true for the 15 groups above
  examId             String?
  exam               Exam?    @relation(fields: [examId], references: [id])
  decision           DuplicateReviewDecision @default(UNRESOLVED)
  decidedById        String?
  decidedBy          User?    @relation(fields: [decidedById], references: [id])
  decidedAt          DateTime?
  decisionNotes      String?  @db.Text

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([signatureHash])
  @@map("question_duplicate_groups")
}
```

Every field the task asks for is covered: **Question IDs** (`memberLegacyIds`/`memberQuestionIds`), **normalized text** (derivable from any member's `Question.translations`, not re-stored redundantly), **similarity reason** (`similarityReason`), **exam/category** (`examId`, populated once the question-bank mapping from Task 1 resolves it — until then, null, not guessed), **existing options** (read live from `QuestionOption`, not duplicated into this table), **source/year** — the legacy data has no explicit "year" field (see `LEGACY_DATABASE_ANALYSIS.md` §5); if a year is ever recoverable it would come from `questionreports`-adjacent context or the admin's own knowledge during review, not fabricated here.

## Review workflow

1. Import proceeds **normally** for every question — duplicate membership does not block import (per `MIGRATION_STATUS_DESIGN.md`, a question whose hash matches an existing group gets `QuestionMigrationStatus.DUPLICATE_REVIEW`, but the `Question` row is still created — nothing is withheld from the question bank while awaiting review).
2. `QuestionDuplicateGroup` rows are created once, at first hash collision — a group is a shared object, not duplicated per pair.
3. Admin UI (spec'd, not built): a list of `UNRESOLVED` groups, sorted with `hasAnswerConflict = true` groups first (highest risk). Each group shows every member's rendered question + options side by side.
4. Admin picks **KEEP** (they're legitimately separate, e.g. same wording used across two different exams on purpose), **MERGE** (pick a canonical `Question`, the others get `Question.status = ARCHIVED` and a note pointing at the canonical one — never hard-deleted), or **ARCHIVE** (all near-duplicates, none is clearly canonical, but the redundancy shouldn't clutter active question banks — same non-destructive archive mechanism).
5. **Reversible by construction**: `ARCHIVED` is a `QuestionStatus` value, not a deletion. Un-archiving is just flipping the status back. `decision` on the group itself can also be changed later (e.g. `MERGE` reverted to `KEEP`) — the group row persists regardless, so the review history is never lost.

## Tier 2 — fuzzy duplicates (not computed in this pass)

The exact question+options hash above only catches byte-identical (after normalization) content. A second, lower-confidence tier — token-set similarity above a threshold on question text alone, same `qwId`+`qtId`, but options don't match exactly — would catch rephrased near-duplicates. This tier was **not run** in this phase (it requires a similarity-scoring pass, not just hashing, and is meaningfully more expensive over 36,879 rows) and is called out here as future scope for the actual import, not claimed as done.

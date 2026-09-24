# Question Migration Plan

Scope: the 36,918-row legacy `questions` table (plus its `tsquestions`/`practicequestions` usage links) — the highest-priority data per the spec's own instruction. This plan describes the pipeline; it has not been run. No code in this plan has been executed against the real database.

---

## 1. Pipeline Overview

```
questions (legacy, streamed row-by-row)
  │
  ▼
[1] Parse row (proper SQL-statement parser, not regex — see §2)
  │
  ▼
[2] Validate structurally
      - totalOptions matches option-key count in the JSON?
      - correctAns within [1, totalOptions]?
      - question text non-empty after HTML-stripping?
  │  fail → record in "invalid" bucket, do NOT insert, continue to next row
  ▼
[3] Detect language (Devanagari heuristic + mixed-content flag)
  │
  ▼
[4] Clean HTML (strip Word-paste noise, keep semantic markup)
  │
  ▼
[5] Resolve subjectId/topicId via questiontags → Subject/Topic
      (blocked on the manual qwId→Exam mapping — see mapping doc)
  │
  ▼
[6] Duplicate check (exact hash + fuzzy signature — see §4)
      - high confidence duplicate → skip, record in "duplicates" bucket
      - low confidence → import anyway, flag in "review" bucket
  │
  ▼
[7] Insert Question + QuestionTranslation + QuestionOption + OptionTranslation
      inside a single Prisma transaction per question
  │
  ▼
[8] Write LegacyIdMap row (legacySource, legacyTable='questions', legacyId=qId, newEntity='Question', newId)
  │
  ▼
[9] Accumulate counters → migration-report.json / migration-report.md
```

Then a second pass migrates `tsquestions`/`practicequestions` into `TestQuestion`, resolving both sides (`testId`/`pratId` and `qId`) through `LegacyIdMap` lookups — this pass can only run after the `tests`/`practicetests` and `questions` passes have completed.

---

## 2. Why Not Regex Over the Raw SQL

The analysis phase used quick regex-based scripts to get approximate counts fast (explicitly labelled as sample-based in the analysis doc). **The real import must not do this.** `question`/`options`/`qHint` contain arbitrary HTML with nested quotes, backslash-escaping, and MS-Word-paste artifacts — a regex-based row splitter silently misparsed 39 of 36,918 rows even for the simple task of extracting question text. For the actual migration:

- Either restore the dump into a **scratch MySQL database** (a throwaway import target, separate from the live app DB — matching the pattern already used successfully in this project's earlier legacy-question import, see `backend/prisma/import-legacy.ts`) and read rows via a real SQL client (`mysql2`/Prisma raw query) — this guarantees 100% correct parsing since MySQL itself parses the dump.
- Or use a proper SQL-dump parser library rather than hand-rolled regex.

The scratch-database approach is strongly preferred: it's exactly the pattern already proven earlier in this project (a `legacy_import` scratch DB, dropped after use), it sidesteps every quoting/escaping edge case, and it lets validation queries (§3) run as real SQL instead of more regex.

---

## 3. Validation Queries (run against the scratch DB before touching the new schema)

These are the concrete checks that turn "36,918 rows exist" into "N rows are actually importable":

```sql
-- Structural: does totalOptions match the actual option count in the JSON?
-- (requires JSON_LENGTH, available once loaded into real MySQL)
SELECT qId, totalOptions, JSON_LENGTH(options) AS actualOptions
FROM questions
WHERE JSON_LENGTH(options) != totalOptions;

-- correctAns out of range
SELECT qId, correctAns, totalOptions
FROM questions
WHERE CAST(correctAns AS UNSIGNED) NOT BETWEEN 1 AND totalOptions;

-- Orphaned qtId (question tag doesn't exist)
SELECT q.qId, q.qtId
FROM questions q
LEFT JOIN questiontags t ON t.qtId = q.qtId
WHERE t.qtId IS NULL;

-- sqtId not actually a child of qtId (validates the assumed hierarchy from the analysis doc)
SELECT q.qId, q.qtId, q.sqtId, st.parentQtId
FROM questions q
JOIN questiontags st ON st.qtId = q.sqtId
WHERE q.sqtId IS NOT NULL AND st.parentQtId != q.qtId;

-- Orphaned qwId (question bank doesn't exist)
SELECT q.qId, q.qwId
FROM questions q
LEFT JOIN questionbanks b ON b.qwId = q.qwId
WHERE b.qwId IS NULL;

-- Empty question text after stripping tags (needs app-side check, not pure SQL)
```

Each query's result count becomes a line item in the data-quality section of the migration report — actual counts from actually running these, not estimates.

---

## 4. Duplicate Detection

Per the spec's explicit instruction: **do not use question text alone, and never auto-delete a suspected duplicate.**

**Tier 1 — exact duplicate (high confidence, safe to skip automatically):**
`normalize(question_text)` (strip HTML, collapse whitespace, lowercase) hashed with MD5. If two questions have the same hash **and** the same `qwId` **and** the same `qtId`, treat as an exact duplicate — skip the later one, log both `qId`s and the kept `qId` in the report. (The analysis-phase sample scan found 2,180 such groups without even the subject/topic match — the real check narrows this further and will likely find fewer true duplicates once subject/topic is factored in, since the same phrase can legitimately appear as a red herring/distractor in an unrelated question.)

**Tier 2 — fuzzy duplicate (low confidence, flag for admin review, do not skip):**
Same `qwId` + `qtId`, and normalized-text similarity above a threshold (Levenshtein ratio or token-set Jaccard similarity ≥ 0.85) but not an exact hash match. These are imported normally but written with `metadata.possibleDuplicateOf = [qId, ...]` (or into the proposed `QuestionReview` queue) so an admin can merge/reject later — never silently dropped.

**What's explicitly not attempted:** matching duplicates *across* `qwId` boundaries automatically. A question bank boundary is a deliberate content-organization signal from the original system; conflating banks during dedup would be a bigger correctness risk than leaving a rare cross-bank duplicate in place.

---

## 5. Legacy ID Mapping (repeatability)

A new table is required (proposed in `PROPOSED_SCHEMA_ADDITIONS.md`):

```prisma
model LegacyIdMap {
  id           String   @id @default(cuid())
  legacySource String   // e.g. "testmela_gurumantra"
  legacyTable  String   // e.g. "questions"
  legacyId     String   // the original qId/tId/etc, stored as string to cover bigint/int both
  newEntity    String   // e.g. "Question"
  newId        String   // the new cuid

  createdAt DateTime @default(now())

  @@unique([legacySource, legacyTable, legacyId])
  @@index([newEntity, newId])
  @@map("legacy_id_map")
}
```

The importer's insert step is always: **look up `(legacySource, legacyTable, legacyId)` first; if found, skip (already imported); if not found, insert + write the map row inside the same transaction.** This is what makes `npm run migrate:legacy` safe to run repeatedly — a second run finds every row already mapped and does nothing, rather than relying on fragile content-based idempotency.

---

## 6. Language Handling

No language column exists in the legacy data (confirmed by scanning every column name in every table — see analysis doc). The import must **detect**, not assume:

- If the normalized question text contains Devanagari characters (Unicode range U+0900–U+097F) and no meaningful Latin-alphabet content → write a single `QuestionTranslation` with `language = HI`.
- If Latin-alphabet only → `language = EN`.
- If both are present in meaningful quantity (the "mixed" bucket — 15,491 of 36,879 in the sample scan, the *largest* single bucket) → **do not guess.** Default to writing it as `HI` if Devanagari is present at all (since a Hindi reader can parse embedded English terms, but not vice versa), but flag every such row with `metadata.languageDetectionConfidence = 'mixed'` for admin review. This is a defensible default, not a silent one — it's visible in the import report and queryable after the fact.
- **Never fabricate the missing-language translation.** A Hindi-only legacy question stays Hindi-only in the new system until someone actually translates it — the existing `pickText()` fallback logic in `AttemptsService` already handles "requested language missing, fall back to whatever exists," so this is safe, not a functionality gap.

---

## 7. Import Report

Every run produces both `migration-report.json` (machine-readable) and `migration-report.md` (human-readable), with these fields — populated from actual counters during the run, never pre-filled or estimated:

```json
{
  "runAt": "ISO timestamp",
  "sourceFile": "testmela(gurumantra).sql",
  "table": "questions",
  "legacyRecordsFound": 0,
  "imported": 0,
  "skippedAlreadyImported": 0,
  "skippedDuplicate": 0,
  "skippedInvalid": 0,
  "flaggedForReview": 0,
  "errors": [{ "legacyId": "...", "reason": "..." }],
  "unmappedRelationships": [{ "legacyId": "...", "field": "qwId", "value": 0 }],
  "warnings": [{ "legacyId": "...", "warning": "..." }]
}
```

The corresponding `.md` renders this as a summary table plus a truncated (first 100) list of each error/warning category, with a note if the list was truncated and where to find the full JSON.

---

## 8. Rollout Order (controlled sample before full run)

Matches the spec's own phase order:

1. **Dry run** against the scratch DB only, no writes to the app database, just producing the report — to see real counts before anything is committed.
2. **Controlled sample import**: one `qwId` (question bank) worth of questions (the smallest non-trivial bank, to keep review fast) into a local dev database, then manually spot-check ~20 imported questions side-by-side against the original HTML in the dump.
3. **Validate**: confirm option order/correct-answer mapping is right by rendering a few imported questions through the actual student-facing question UI (not just eyeballing raw DB rows) — this is the same "verify via the running app, not just the database" approach already used successfully for the first legacy import earlier in this project.
4. **Full import**, only after step 3 passes.
5. **Post-import validation**: row-count reconciliation (imported + skipped + invalid + duplicate == legacyRecordsFound, exactly), plus the `tsquestions`/`practicequestions` join-table pass, plus a final spot-check of a random sample (not just the first N rows) of imported questions.

No step here has been executed. This plan stops at the design stage, per the instruction to halt after analysis.

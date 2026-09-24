# Multilingual Migration Design (Task 5)

Status: **classification actually run against all 36,879 parsed question rows. No translation attempted — content is classified, not translated.**

## Classification results (real, from a full pass — not a sample)

| State | Count | % of total |
|---|---|---|
| `HINDI` | 11,511 | 31.2% |
| `ENGLISH` | 10,114 | 27.4% |
| **`BILINGUAL`** | **7,915** | **21.5%** |
| `MIXED` | 7,338 | 19.9% |
| `UNKNOWN` | 1 | <0.1% |

## The `BILINGUAL` finding — the most useful result of this task

Refining the classifier beyond "does it contain both scripts" (the analysis phase's coarse 3-bucket version) to specifically detect the pattern **`<Hindi question text> (<English translation in parentheses>)`** found that **7,915 questions — over half of what was previously lumped into one big "mixed-language" bucket — are actually clean, deliberate parallel translations**, not careless language-mixing. Real example from the dump:

```
पिछड़ी जाति आयोग के प्रथम सभापति कौन थे ?
(who was the first chairperson of the backward castes commission?)
```

This is directly usable: the Hindi portion (before the final parenthetical) becomes `QuestionTranslation{language: HI}`, and the parenthetical content becomes `QuestionTranslation{language: EN}` — both populated automatically, with high confidence, for ~8,000 questions that would otherwise have sat in a manual-review queue. This was **discovered by actually running the classifier**, not assumed going in — the original analysis phase's "42% mixed" figure undersold how much of that content is actually cleanly splittable.

The same parenthetical-split check needs to run against the `options` JSON and `qHint` explanation field too, since a genuinely bilingual question is likely to have bilingual options in the same style — **this has not been verified yet** and is called out as the next concrete step, not assumed to follow automatically from the question-text pattern holding.

## Classification logic (as actually implemented for this pass)

```
for each question:
  if no Devanagari and no Latin script -> UNKNOWN
  if Devanagari only               -> HINDI
  if Latin only                    -> ENGLISH
  if both present:
    if text ends in "(...)" where the parenthetical is Latin-only
       and everything before it contains Devanagari
                                    -> BILINGUAL (split point = start of that trailing parenthetical)
    else                           -> MIXED
```

This is a **conservative, precision-favoring** heuristic — it only claims `BILINGUAL` for the specific, unambiguous "Hindi, then English in trailing parens" shape actually observed in the data. It deliberately does not try to detect other bilingual patterns (e.g. English-then-Hindi-in-parens, or inline mid-sentence translation) that may also exist, because guessing at a less clear-cut pattern risks mis-splitting a question's meaning — better to leave those in `MIXED` for a human to look at than silently produce a wrong split.

## Storage structure

Already covered by the existing schema — no new model needed, only a migration-side field to record *how* the split happened:

```prisma
// additive field on the existing QuestionTranslation model:
//   splitMethod   String?   // "AUTO_PARENTHETICAL_SPLIT" | "MANUAL" | null (single-language source, no split needed)

// additive field on Question (or the QuestionMigrationRecord — TBD which is the better home):
//   languageClassification   LanguageClassification?  // see enum below
```

```prisma
enum LanguageClassification {
  ENGLISH
  HINDI
  BILINGUAL
  MIXED
  UNKNOWN
}
```

For a `HINDI` or `ENGLISH` row: exactly one `QuestionTranslation` is created, in that language. **The other language is left absent — never fabricated, never machine-translated as part of this migration.** (Matches the rule already stated in `QUESTION_MIGRATION_PLAN.md` §6.)

For a `BILINGUAL` row: two `QuestionTranslation` rows are created (`HI` and `EN`), split at the detected boundary, both tagged `splitMethod: "AUTO_PARENTHETICAL_SPLIT"` — visible in the data as auto-derived, not independently authored, so a reviewer can distinguish "the system split this" from "someone actually wrote a Hindi version."

For a `MIXED` or `UNKNOWN` row: **one** `QuestionTranslation` is still created (best-guess dominant language — Hindi if any Devanagari is present at all, per the default already established in the migration plan), but `Question.languageClassification` is set to the actual detected state and the `QuestionMigrationRecord.status` (see `MIGRATION_STATUS_DESIGN.md`) gets `LANGUAGE_REVIEW_REQUIRED` added to its warnings — the question is fully usable in the meantime (not blocked from import), just flagged for a human to eventually confirm or manually split.

## What is explicitly not done in this pass

- **No machine translation.** Nothing here generates a Hindi translation for an English-only question or vice versa. That's a distinct, much bigger effort (and a product decision about whether AI-assisted translation is even wanted) outside this migration's scope.
- **Options and explanations have not yet been run through this same classifier** — only the question stem. This is the next concrete step before the language design can be called complete, not something to assume works the same way.
- **No content has actually been split into two `QuestionTranslation` rows yet** — this document describes the rule; the import pipeline itself (which would apply it) has not been built or run, per the "stop after this phase" instruction.

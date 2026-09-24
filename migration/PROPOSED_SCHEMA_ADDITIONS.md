# Proposed Prisma Schema Additions

**This is a proposal document only — none of this has been applied to `backend/prisma/schema.prisma` or migrated against the database.** Per the "stop after analysis" instruction, no `prisma migrate` has been run for anything in this document.

The current schema (built in the earlier Live Test / multi-exam pass) already has real models for most of what the new spec asks for — this document lists the **delta** on top of that, not a redesign. Where the spec's conceptual structure (§4 of the new spec) already exists under a different name, that's called out explicitly rather than proposing a duplicate.

## Already exists — reuse, don't recreate

| Spec's conceptual entity | Existing model |
|---|---|
| `Exam` | `Exam` |
| `ExamCycle` | `ExamCycle` |
| `Syllabus` | `SyllabusVersion` + `SyllabusTopic` |
| `Subject` | `Subject` |
| `Topic` | `Topic` |
| `QuestionTranslation` | `QuestionTranslation` |
| `QuestionOption` | `QuestionOption` |
| `OptionTranslation` (options in each language) | `OptionTranslation` |
| Student multi-exam profile | `StudentExamProfile` (already has `isPrimary`, `preferredLanguage`, `targetExamDate`, `prepStatus`) |
| Live Test with fixed schedule + integrity monitoring | `LiveTest`, `LiveTestAttempt`, `ExamIntegrityEvent`, `IntegrityPolicy`, `LiveTestAuditLog` |
| Slot booking with capacity | `TestSlot`, `SlotReservation`, `SlotBooking` |
| Subscription/entitlement | `SubscriptionPlan`, `PlanEntitlement`, `Subscription` |
| Notification center | `Notification`, `NotificationPreference`, `NotificationRule` |

## New — proposed additions

### 1. `SubTopic` (spec §4/§14)

Only needed if the legacy `sqtId` validation (see `QUESTION_MIGRATION_PLAN.md` §3) confirms a genuine third tier isn't already covered by `Subject`→`Topic`. Proposed shape, additive to the existing `Topic` model:

```prisma
model SubTopic {
  id       String @id @default(cuid())
  topicId  String
  topic    Topic  @relation(fields: [topicId], references: [id], onDelete: Cascade)
  nameEn   String
  nameHi   String?

  questions Question[]

  @@index([topicId])
  @@map("sub_topics")
}
```

### 2. Question workflow & provenance fields (spec §5, §20, §22)

The existing `Question` model has no status/source/AI fields at all — every question today is implicitly "published." Proposed additive fields:

```prisma
enum QuestionStatus {
  DRAFT
  AI_GENERATED
  PENDING_REVIEW
  APPROVED
  PUBLISHED
  REJECTED
  ARCHIVED
}

enum QuestionSourceType {
  MANUAL
  IMPORTED
  PREVIOUS_YEAR
  AI_GENERATED
  CURRENT_AFFAIRS
}

// additive fields on the existing Question model:
//   examId              String?
//   exam                Exam?              @relation(fields: [examId], references: [id])
//   examCycleId         String?
//   examCycle           ExamCycle?         @relation(fields: [examCycleId], references: [id])
//   syllabusVersionId   String?
//   syllabusVersion     SyllabusVersion?   @relation(fields: [syllabusVersionId], references: [id])
//   subTopicId          String?
//   subTopic            SubTopic?          @relation(fields: [subTopicId], references: [id])
//   questionCode        String?            @unique
//   status              QuestionStatus     @default(PUBLISHED)
//   source              QuestionSourceType @default(MANUAL)
//   sourceReference      String?            // e.g. "UPSC CSE 2019 Prelims GS1 Q45"
//   isAiGenerated       Boolean            @default(false)
//   isAiVerified        Boolean            @default(false)
//   isPublished         Boolean            @default(true)
```

`status` defaults to `PUBLISHED` rather than `DRAFT` so existing questions and the freshly-imported legacy questions (already live, already answered by real students) aren't retroactively hidden — only new AI-generated questions default into the `AI_GENERATED`/`PENDING_REVIEW` states per spec §19/§20.

### 3. `QuestionVersion` (spec §28)

```prisma
model QuestionVersion {
  id          String   @id @default(cuid())
  questionId  String
  question    Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  versionNum  Int
  snapshot    Json     // full translation/option state at this version
  changedById String?
  changedBy   User?    @relation(fields: [changedById], references: [id])
  changeReason String? @db.Text
  createdAt   DateTime @default(now())

  @@unique([questionId, versionNum])
  @@map("question_versions")
}
```

### 4. `QuestionTag` (spec §4 — distinct from Subject/Topic)

The spec lists `QuestionTag` alongside `Subject`/`Topic`/`SubTopic` as a separate concept — likely free-form labels (e.g. "PYQ", "high-yield", "tricky") rather than the strict curriculum hierarchy. Proposed as a simple many-to-many, not another hierarchy:

```prisma
model QuestionTag {
  id     String @id @default(cuid())
  name   String @unique

  questions QuestionTagLink[]

  @@map("question_tags")
}

model QuestionTagLink {
  questionId String
  question   Question    @relation(fields: [questionId], references: [id], onDelete: Cascade)
  tagId      String
  tag        QuestionTag @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([questionId, tagId])
  @@map("question_tag_links")
}
```

### 5. `QuestionReview` (spec §20, §29)

```prisma
enum ReviewDecision {
  APPROVED
  REJECTED
  NEEDS_CHANGES
}

model QuestionReview {
  id          String          @id @default(cuid())
  questionId  String
  question    Question        @relation(fields: [questionId], references: [id], onDelete: Cascade)
  reviewedById String?
  reviewedBy  User?           @relation(fields: [reviewedById], references: [id])
  decision    ReviewDecision?
  notes       String?         @db.Text
  createdAt   DateTime        @default(now())

  @@index([questionId])
  @@map("question_reviews")
}
```

### 6. `QuestionUsage` (spec §4, §24 — for personalization)

Tracks where/how often a question has actually been used, to support "don't over-serve the same question" and performance-based recommendation:

```prisma
model QuestionUsage {
  id          String   @id @default(cuid())
  questionId  String
  question    Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  usedInType  String   // "TEST" | "PRACTICE_GENERATION" | "AI_BLUEPRINT" — free-form, low ceremony
  usedInId    String?  // the Test id or generation-job id, when applicable
  usedAt      DateTime @default(now())

  @@index([questionId])
  @@map("question_usage")
}
```

### 7. `TestBlueprint` (spec §26)

```prisma
model TestBlueprint {
  id           String              @id @default(cuid())
  name         String
  examId       String
  exam         Exam                @relation(fields: [examId], references: [id])
  totalMarks   Decimal             @db.Decimal(8, 2)
  sections     TestBlueprintSection[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("test_blueprints")
}

model TestBlueprintSection {
  id            String        @id @default(cuid())
  blueprintId   String
  blueprint     TestBlueprint @relation(fields: [blueprintId], references: [id], onDelete: Cascade)
  subjectId     String
  subject       Subject       @relation(fields: [subjectId], references: [id])
  questionCount Int

  @@map("test_blueprint_sections")
}
```

### 8. AI Question Generation (spec §18–§21)

```prisma
enum AiJobStatus {
  QUEUED
  RUNNING
  COMPLETED
  FAILED
}

model AiGenerationJob {
  id                String      @id @default(cuid())
  requestedById     String
  requestedBy       User        @relation(fields: [requestedById], references: [id])
  examId            String
  exam              Exam        @relation(fields: [examId], references: [id])
  examCycleId       String?
  syllabusVersionId String?
  subjectId         String?
  topicId           String?
  difficulty        Difficulty?
  language          Language
  requestedCount    Int
  status            AiJobStatus @default(QUEUED)
  errorMessage      String?     @db.Text

  generatedQuestions Question[]

  createdAt   DateTime  @default(now())
  completedAt DateTime?

  @@map("ai_generation_jobs")
}
```

Per spec §18/§21, this job is the *only* path by which `Question.isAiGenerated = true` rows are created — it carries the structured `examId`/`syllabusVersionId`/`subjectId`/`topicId` context so the AI is never left to invent its own idea of the syllabus. Reuses the existing `@nestjs/schedule` cron-sweep pattern already established for the Live Test engine (rather than adding Redis/BullMQ) — a job row is picked up and processed by a scheduled sweep, consistent with the decision already made and documented for this project's background-job approach.

### 9. Current Affairs Question linkage (spec §23)

The existing `CurrentAffair` model already exists. Proposed link so current-affairs-derived questions carry provenance instead of `Question.sourceReference` being a bare string:

```prisma
// additive field on Question:
//   currentAffairId String?
//   currentAffair   CurrentAffair? @relation(fields: [currentAffairId], references: [id])
```

### 10. `LegacyIdMap` (spec §9, §33 — migration infrastructure)

Already specified in full in `QUESTION_MIGRATION_PLAN.md` §5 — repeated here for completeness of the schema-delta list:

```prisma
model LegacyIdMap {
  id           String   @id @default(cuid())
  legacySource String
  legacyTable  String
  legacyId     String
  newEntity    String
  newId        String
  createdAt    DateTime @default(now())

  @@unique([legacySource, legacyTable, legacyId])
  @@index([newEntity, newId])
  @@map("legacy_id_map")
}
```

---

## What's deliberately not proposed yet

- **`TestSection`** — only if the product confirms legacy `testsections` per-section grouping needs to survive (see mapping doc); the lower-risk default is to flatten it away.
- **Subscription/entitlement restructuring for legacy packages** — blocked on the product decision described in `LEGACY_TO_NEW_MAPPING.md` §Packages/Subscriptions; adding schema for this before that decision would risk building the wrong shape.
- **A `Comment`/`Discussion` system** — no equivalent exists today and the mapping doc recommends leaving legacy blog/lecture/discussion comments out of scope for this pass.
- **`VideoModule`, offline-batch fields, postal-course commerce** — all flagged as lossy/out-of-scope in the mapping doc; proposing schema for them now would be scope creep ahead of a product decision.

---

## Suggested migration name (once approved)

`npx prisma migrate dev --name question_bank_workflow_and_legacy_import` — additive only, no existing column dropped or retyped. This has **not** been run.

/**
 * One-off migration script: imports the legacy Test Mela MySQL dump
 * (already loaded into a scratch `legacy_import` database — see the import
 * chapter in the session for how it was prepared) into the new normalized
 * schema.
 *
 * Run with: npx ts-node prisma/import-legacy.ts
 *
 * Source tables used:
 *   - courses          -> Course
 *   - questions        -> category labels (id -> name), used only to name
 *                          the generated TestSeries/Course grouping
 *   - question_banks   -> Question + QuestionTranslation(HI) + QuestionOption
 *                          + OptionTranslation(HI), grouped into Tests by
 *                          `tag_id` (each tag_id is ~50-150 questions authored
 *                          together — the closest thing to a "test" in the
 *                          legacy schema, since `connect_question` — the
 *                          actual test<->question link table — is empty in
 *                          this dump).
 *
 * Rows are only imported when `correct_answer` is a clean integer within
 * [1, total_options] — everything else (unfinished "--Select Type--" draft
 * rows, typos like "oprion1") is skipped and logged, never guessed at.
 *
 * Imported content is created as DRAFT (Test.status) / unpublished
 * (TestSeries.isPublished = false) so nothing goes live to real students
 * until reviewed in the admin console.
 */
import mysql from 'mysql2/promise';
import { convert } from 'html-to-text';
import {
  PrismaClient,
  Language,
  TestStatus,
  TestType,
  Prisma,
} from '@prisma/client';

const prisma = new PrismaClient();

const LEGACY_DB_HOST = process.env.LEGACY_DB_HOST ?? 'localhost';
const LEGACY_DB_PORT = Number(process.env.LEGACY_DB_PORT ?? 3306);
const LEGACY_DB_USER = process.env.LEGACY_DB_USER ?? 'root';
const LEGACY_DB_PASSWORD = process.env.LEGACY_DB_PASSWORD ?? 'root';
const LEGACY_DB_NAME = process.env.LEGACY_DB_NAME ?? 'legacy_import';

const CHUNK_SIZE = 400;

function html(text: string | null | undefined): string {
  if (!text) return '';
  return convert(text, {
    wordwrap: false,
    selectors: [
      { selector: 'a', options: { ignoreHref: true } },
      { selector: 'img', format: 'skip' },
    ],
  })
    .replace(/ /g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

interface LegacyCourse {
  id: number;
  title: string;
  description: string | null;
}

interface LegacyQuestionCategory {
  id: number;
  name: string;
}

interface LegacyQuestionBankRow {
  id: number;
  tag_id: number;
  question_tileid: number;
  question: string;
  marks: number;
  negative_marks: number;
  total_options: number;
  options: string;
  correct_answer: string;
}

async function chunked<T>(items: T[], size: number, fn: (batch: T[]) => Promise<void>) {
  for (let i = 0; i < items.length; i += size) {
    await fn(items.slice(i, i + size));
  }
}

// A small set of category -> course name hints. Anything not listed here
// gets no course link (courseId stays null) rather than a guessed match.
const CATEGORY_COURSE_HINTS: Record<string, string> = {
  'UPSC 2026': 'UPSC Test',
  BPSC: 'BPSC Test',
};

async function main() {
  const legacy = await mysql.createConnection({
    host: LEGACY_DB_HOST,
    port: LEGACY_DB_PORT,
    user: LEGACY_DB_USER,
    password: LEGACY_DB_PASSWORD,
    database: LEGACY_DB_NAME,
  });

  console.log('Connected to legacy database.');

  // ---------------------------------------------------------------------
  // 1. Courses
  // ---------------------------------------------------------------------
  const [legacyCourses] = await legacy.query<mysql.RowDataPacket[]>(
    'SELECT id, title, description FROM courses',
  );
  const courseNameToId = new Map<string, string>();
  for (const row of legacyCourses as unknown as LegacyCourse[]) {
    const titleEn = row.title.trim();
    let course = await prisma.course.findFirst({ where: { titleEn } });
    if (!course) {
      course = await prisma.course.create({
        data: {
          titleEn,
          descriptionEn: html(row.description).slice(0, 5000) || undefined,
          isPublished: false,
        },
      });
      console.log(`  + Course "${titleEn}"`);
    }
    courseNameToId.set(titleEn, course.id);
  }

  // ---------------------------------------------------------------------
  // 2. Category labels (the `questions` table) — used only for naming
  // ---------------------------------------------------------------------
  const [legacyCategories] = await legacy.query<mysql.RowDataPacket[]>(
    'SELECT id, name FROM questions',
  );
  const categoryNameById = new Map<number, string>();
  for (const row of legacyCategories as unknown as LegacyQuestionCategory[]) {
    categoryNameById.set(row.id, row.name.trim());
  }

  // ---------------------------------------------------------------------
  // 3. Question bank rows worth importing
  // ---------------------------------------------------------------------
  const [allRows] = await legacy.query<mysql.RowDataPacket[]>(
    'SELECT id, tag_id, question_tileid, question, marks, negative_marks, total_options, options, correct_answer FROM question_banks ORDER BY question_tileid, tag_id, id',
  );
  const rows = allRows as unknown as LegacyQuestionBankRow[];

  let skippedBadAnswer = 0;
  let skippedBadOptions = 0;
  let skippedEmptyText = 0;

  const valid = rows.filter((r) => {
    const answerIndex = Number(r.correct_answer);
    if (
      !/^\d+$/.test(String(r.correct_answer).trim()) ||
      !Number.isInteger(answerIndex) ||
      answerIndex < 1 ||
      answerIndex > r.total_options
    ) {
      skippedBadAnswer++;
      return false;
    }
    if (!html(r.question)) {
      skippedEmptyText++;
      return false;
    }
    return true;
  });

  console.log(
    `Question bank: ${rows.length} total, ${valid.length} valid, ${skippedBadAnswer} skipped (bad correct_answer), ${skippedEmptyText} skipped (empty question text)`,
  );

  // Group by category (question_tileid) then by test (tag_id)
  const byCategory = new Map<number, Map<number, LegacyQuestionBankRow[]>>();
  for (const row of valid) {
    if (!byCategory.has(row.question_tileid)) byCategory.set(row.question_tileid, new Map());
    const byTag = byCategory.get(row.question_tileid)!;
    if (!byTag.has(row.tag_id)) byTag.set(row.tag_id, []);
    byTag.get(row.tag_id)!.push(row);
  }

  let testsCreated = 0;
  let questionsCreated = 0;
  let optionsCreated = 0;

  for (const [tileId, byTag] of byCategory) {
    const categoryLabel = categoryNameById.get(tileId) ?? `Imported Category ${tileId}`;
    const courseName = CATEGORY_COURSE_HINTS[categoryLabel];
    const courseId = courseName ? courseNameToId.get(courseName) : undefined;

    let testSeries = await prisma.testSeries.findFirst({
      where: { titleEn: `${categoryLabel} — Question Bank (Imported)` },
    });
    if (!testSeries) {
      testSeries = await prisma.testSeries.create({
        data: {
          courseId,
          titleEn: `${categoryLabel} — Question Bank (Imported)`,
          descriptionEn: `Practice sets imported from the legacy question bank (${categoryLabel}).`,
          isFree: true,
          price: 0,
          isPublished: false,
        },
      });
      console.log(`  + TestSeries "${testSeries.titleEn}"`);
    }

    let volume = await prisma.testVolume.findFirst({
      where: { testSeriesId: testSeries.id, titleEn: 'Imported Practice Sets' },
    });
    if (!volume) {
      volume = await prisma.testVolume.create({
        data: { testSeriesId: testSeries.id, titleEn: 'Imported Practice Sets', order: 0 },
      });
    }

    for (const [tagId, questionRows] of byTag) {
      const test = await prisma.test.create({
        data: {
          testVolumeId: volume.id,
          titleEn: `${categoryLabel} — Practice Set ${tagId}`,
          type: TestType.PRACTICE,
          status: TestStatus.DRAFT,
          durationMinutes: Math.max(10, questionRows.length),
          marksPerQuestion: 1,
          negativeMarks: 0,
          isFree: true,
          price: 0,
        },
      });
      testsCreated++;

      await chunked(questionRows, CHUNK_SIZE, async (batch) => {
        const questionIds: string[] = [];
        const questionData: Prisma.QuestionCreateManyInput[] = [];
        const translationData: Prisma.QuestionTranslationCreateManyInput[] = [];
        const optionData: {
          id: string;
          questionId: string;
          order: number;
          isCorrect: boolean;
          textHi: string;
        }[] = [];
        const testQuestionData: Prisma.TestQuestionCreateManyInput[] = [];

        for (let i = 0; i < batch.length; i++) {
          const row = batch[i];
          const questionText = html(row.question);
          if (!questionText) {
            skippedEmptyText++;
            continue;
          }

          let options: string[];
          try {
            const parsed = JSON.parse(row.options);
            if (!Array.isArray(parsed)) throw new Error('not an array');
            options = parsed.map((o) => html(String(o)));
          } catch {
            skippedBadOptions++;
            continue;
          }
          if (options.length < 2 || options.some((o) => !o)) {
            skippedBadOptions++;
            continue;
          }

          const correctIndex = Number(row.correct_answer) - 1;
          // Guard against a parsed options array shorter than total_options
          // implied — never create a question with no correct option marked.
          if (correctIndex < 0 || correctIndex >= options.length) {
            skippedBadOptions++;
            continue;
          }
          const questionId = `legacy-q-${row.id}`;
          questionIds.push(questionId);
          questionData.push({
            id: questionId,
            marks: row.marks && row.marks > 0 ? row.marks : 1,
            negativeMarks: row.negative_marks && row.negative_marks > 0 ? row.negative_marks : 0,
          });
          translationData.push({
            questionId,
            language: Language.HI,
            text: questionText,
          });

          options.forEach((optText, idx) => {
            const optionId = `legacy-o-${row.id}-${idx}`;
            optionData.push({
              id: optionId,
              questionId,
              order: idx,
              isCorrect: idx === correctIndex,
              textHi: optText,
            });
          });

          testQuestionData.push({
            testId: test.id,
            questionId,
            order: i,
          });
        }

        if (questionData.length === 0) return;

        await prisma.question.createMany({ data: questionData, skipDuplicates: true });
        await prisma.questionTranslation.createMany({
          data: translationData,
          skipDuplicates: true,
        });
        await prisma.questionOption.createMany({
          data: optionData.map((o) => ({
            id: o.id,
            questionId: o.questionId,
            order: o.order,
            isCorrect: o.isCorrect,
          })),
          skipDuplicates: true,
        });
        await prisma.optionTranslation.createMany({
          data: optionData.map((o) => ({
            optionId: o.id,
            language: Language.HI,
            text: o.textHi,
          })),
          skipDuplicates: true,
        });
        await prisma.testQuestion.createMany({ data: testQuestionData, skipDuplicates: true });

        questionsCreated += questionData.length;
        optionsCreated += optionData.length;
      });
    }
  }

  await legacy.end();

  console.log('\n--- Import complete ---');
  console.log(`Tests created:      ${testsCreated}`);
  console.log(`Questions created:  ${questionsCreated}`);
  console.log(`Options created:    ${optionsCreated}`);
  console.log(`Skipped (answer):   ${skippedBadAnswer}`);
  console.log(`Skipped (options):  ${skippedBadOptions}`);
  console.log(`Skipped (empty):    ${skippedEmptyText}`);
  console.log(
    '\nEverything was imported as DRAFT / unpublished. Review in the admin console, then publish.',
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

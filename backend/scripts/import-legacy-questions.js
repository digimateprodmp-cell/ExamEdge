/**
 * One-time, idempotent import of the legacy `questions`/`questiontags` data
 * (already staged into legacy_questions_staging / legacy_questiontags_staging
 * by import-legacy-staging.js) into the existing Question Bank architecture:
 * Question (by its pre-existing `legacy_question_<qId>` id) + QuestionTranslation
 * + QuestionOption + OptionTranslation + QuestionTag + QuestionTagAssignment.
 *
 * No new question table, no parallel answer system, no copy of question
 * content into a second place — this only populates the child rows the
 * existing Question Bank / Test Builder / exam engine already read from.
 */
const mysql = require('mysql2/promise');
const { PrismaClient, QuestionStatus, QuestionServingEligibility, QuestionSourceType } = require('@prisma/client');

const prisma = new PrismaClient();
const BATCH_SIZE = 500;

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function parseOptions(optionsJson) {
  let obj;
  try {
    obj = JSON.parse(optionsJson);
  } catch {
    return [];
  }
  return Object.keys(obj)
    .filter((k) => /^option\d+$/.test(k))
    .sort((a, b) => Number(a.replace('option', '')) - Number(b.replace('option', '')))
    .map((k) => ({ num: Number(k.replace('option', '')), text: stripHtml(obj[k]) }))
    .filter((o) => o.text.length > 0);
}

async function importTags(conn) {
  const [rows] = await conn.query('SELECT qtId, qtName FROM legacy_questiontags_staging');
  const map = new Map();
  for (const row of rows) {
    const nameEn = row.qtName?.trim() || `Tag ${row.qtId}`;
    const tag = await prisma.questionTag.upsert({
      where: { legacyTagId: row.qtId },
      update: {},
      create: { nameEn, legacyTagId: row.qtId },
    });
    map.set(row.qtId, tag.id);
  }
  console.log(`Tags imported/verified: ${map.size}`);
  return map;
}

async function main() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: 'root',
    database: 'test_mela',
  });

  const tagMap = await importTags(conn);

  const [[{ total: fullTotal }]] = await conn.query('SELECT COUNT(*) as total FROM legacy_questions_staging');
  const total = process.env.IMPORT_LIMIT ? Math.min(Number(process.env.IMPORT_LIMIT), fullTotal) : fullTotal;
  console.log(`Total legacy questions to process: ${total} (of ${fullTotal})`);

  let processed = 0;
  let created = 0;
  let skipped = 0;

  for (let offset = 0; offset < total; offset += BATCH_SIZE) {
    const [rows] = await conn.query(
      'SELECT id, qId, qwId, qtId, question, marks, negativeMarks, options, correctAns, qHint, type, difficulty FROM legacy_questions_staging ORDER BY qId LIMIT ? OFFSET ?',
      [BATCH_SIZE, offset],
    );

    // Idempotency: skip questions that already have a translation (already imported by a prior run).
    const ids = rows.map((r) => r.id);
    const existing = await prisma.questionTranslation.findMany({
      where: { questionId: { in: ids } },
      select: { questionId: true },
    });
    const alreadyDone = new Set(existing.map((e) => e.questionId));

    for (const row of rows) {
      processed++;
      if (alreadyDone.has(row.id)) {
        skipped++;
        continue;
      }

      const questionText = stripHtml(row.question);
      const explanation = stripHtml(row.qHint) || null;
      const options = parseOptions(row.options);
      if (!questionText || options.length < 2) {
        skipped++;
        continue;
      }
      const correctNum = parseInt(row.correctAns, 10);

      try {
        await prisma.$transaction(async (tx) => {
          await tx.question.upsert({
            where: { id: row.id },
            update: {},
            create: {
              id: row.id,
              type: row.type === 'MULTIPLE_CHOICE' ? 'MULTIPLE_CHOICE' : 'SINGLE_CHOICE',
              difficulty: ['EASY', 'MEDIUM', 'HARD'].includes(row.difficulty) ? row.difficulty : 'MEDIUM',
              marks: row.marks,
              negativeMarks: row.negativeMarks,
              status: QuestionStatus.MISSING_HINDI,
              source: QuestionSourceType.IMPORTED,
              sourceReference: `legacy_qid:${row.qId}`,
              isLegacyGrandfathered: true,
              servingEligibility: QuestionServingEligibility.LEGACY_TEMPORARY,
            },
          });

          await tx.questionTranslation.create({
            data: { questionId: row.id, language: 'EN', text: questionText, explanation },
          });

          for (const opt of options) {
            const optionId = `${row.id}_opt_${opt.num}`;
            await tx.questionOption.create({
              data: {
                id: optionId,
                questionId: row.id,
                order: opt.num - 1,
                isCorrect: opt.num === correctNum,
              },
            });
            await tx.optionTranslation.create({
              data: { optionId, language: 'EN', text: opt.text },
            });
          }

          const tagId = tagMap.get(row.qtId);
          if (tagId) {
            await tx.questionTagAssignment.create({
              data: { questionId: row.id, questionTagId: tagId },
            });
          }
        });
        created++;
      } catch (e) {
        console.error(`Failed on ${row.id}:`, e.message);
        skipped++;
      }
    }

    console.log(`Progress: ${processed}/${total} (created ${created}, skipped ${skipped})`);
  }

  console.log(`Done. Created: ${created}, Skipped: ${skipped}, Total processed: ${processed}`);
  await conn.end();
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

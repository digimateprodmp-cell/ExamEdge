/**
 * Corrective pass: re-derive QuestionTranslation/OptionTranslation text from
 * the still-present legacy staging data using the fixed stripHtml (which now
 * decodes named entities like &rsquo; &mdash; etc.), and update in place only
 * where the text actually changes. No new rows, no touching isCorrect/order/
 * tags/status -- purely fixes the decoded text.
 */
const mysql = require('mysql2/promise');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const NAMED_ENTITIES = {
  nbsp: ' ', quot: '"', amp: '&', lt: '<', gt: '>', apos: "'",
  rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“',
  mdash: '—', ndash: '–', hellip: '…',
  copy: '©', reg: '®', trade: '™', deg: '°',
};

function decodeEntities(text) {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => {
      const key = name.toLowerCase();
      return Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, key) ? NAMED_ENTITIES[key] : m;
    });
}

function stripHtml(html) {
  if (!html) return '';
  return decodeEntities(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function parseOptions(optionsJson) {
  let obj;
  try { obj = JSON.parse(optionsJson); } catch { return []; }
  return Object.keys(obj)
    .filter((k) => /^option\d+$/.test(k))
    .sort((a, b) => Number(a.replace('option', '')) - Number(b.replace('option', '')))
    .map((k) => ({ num: Number(k.replace('option', '')), text: stripHtml(obj[k]) }))
    .filter((o) => o.text.length > 0);
}

async function main() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1', port: 3307, user: 'root', password: 'root', database: 'test_mela',
  });

  const [[{ total }]] = await conn.query('SELECT COUNT(*) as total FROM legacy_questions_staging');
  console.log(`Rechecking ${total} legacy rows for entity-decoding fixes...`);

  let updatedQuestions = 0;
  let updatedOptions = 0;
  const BATCH_SIZE = 500;

  for (let offset = 0; offset < total; offset += BATCH_SIZE) {
    const [rows] = await conn.query(
      'SELECT id, question, options, qHint FROM legacy_questions_staging ORDER BY qId LIMIT ? OFFSET ?',
      [BATCH_SIZE, offset],
    );

    for (const row of rows) {
      const correctText = stripHtml(row.question);
      const correctExplanation = stripHtml(row.qHint) || null;

      const translation = await prisma.questionTranslation.findUnique({
        where: { questionId_language: { questionId: row.id, language: 'EN' } },
      });
      if (translation && (translation.text !== correctText || translation.explanation !== correctExplanation)) {
        await prisma.questionTranslation.update({
          where: { id: translation.id },
          data: { text: correctText, explanation: correctExplanation },
        });
        updatedQuestions++;
      }

      const options = parseOptions(row.options);
      for (const opt of options) {
        const optionId = `${row.id}_opt_${opt.num}`;
        const optTranslation = await prisma.optionTranslation.findUnique({
          where: { optionId_language: { optionId, language: 'EN' } },
        });
        if (optTranslation && optTranslation.text !== opt.text) {
          await prisma.optionTranslation.update({
            where: { id: optTranslation.id },
            data: { text: opt.text },
          });
          updatedOptions++;
        }
      }
    }

    console.log(`Progress: ${Math.min(offset + BATCH_SIZE, total)}/${total} (questions fixed: ${updatedQuestions}, options fixed: ${updatedOptions})`);
  }

  console.log(`Done. Questions fixed: ${updatedQuestions}, Options fixed: ${updatedOptions}`);
  await conn.end();
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

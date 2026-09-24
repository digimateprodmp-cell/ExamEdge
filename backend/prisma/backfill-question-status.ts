/**
 * One-time, idempotent backfill: computes the real QuestionStatus for every
 * existing question based on its actual translation/option completeness,
 * using the exact same rule as QuestionsService.evaluateLanguageStatus.
 *
 * Safe to run repeatedly - always recomputes from current data, never
 * touches a question already PUBLISHED/REJECTED/ARCHIVED (those are
 * explicit admin decisions, not auto-derived).
 *
 * This does NOT change what any API serves - nothing reads `status` to
 * filter practice-test/attempt content yet. It only makes the stored status
 * honest so a later, explicitly-approved stage can safely gate on it.
 */
import { Language, PrismaClient, QuestionStatus } from '@prisma/client';

const prisma = new PrismaClient();

function evaluateLanguageStatus(question: {
  translations: { language: Language; text: string; explanation: string | null }[];
  options: { translations: { language: Language; text: string }[] }[];
}): QuestionStatus {
  const hasText = (lang: Language) =>
    !!question.translations.find((t) => t.language === lang)?.text?.trim();
  const explanationFor = (lang: Language) =>
    question.translations.find((t) => t.language === lang)?.explanation;

  const hasEn = hasText(Language.EN);
  const hasHi = hasText(Language.HI);

  if (!hasEn && !hasHi) return QuestionStatus.DRAFT;
  if (!hasEn) return QuestionStatus.MISSING_ENGLISH;
  if (!hasHi) return QuestionStatus.MISSING_HINDI;

  if (question.options.length === 0) return QuestionStatus.LANGUAGE_REVIEW_REQUIRED;
  for (const option of question.options) {
    const optHasEn = !!option.translations.find((t) => t.language === Language.EN)?.text?.trim();
    const optHasHi = !!option.translations.find((t) => t.language === Language.HI)?.text?.trim();
    if (!optHasEn || !optHasHi) return QuestionStatus.LANGUAGE_REVIEW_REQUIRED;
  }

  const explanationEn = explanationFor(Language.EN);
  const explanationHi = explanationFor(Language.HI);
  const explanationExists = !!explanationEn?.trim() || !!explanationHi?.trim();
  if (explanationExists && (!explanationEn?.trim() || !explanationHi?.trim())) {
    return QuestionStatus.LANGUAGE_REVIEW_REQUIRED;
  }

  return QuestionStatus.PENDING_REVIEW;
}

async function main() {
  const questions = await prisma.question.findMany({
    where: { status: { notIn: [QuestionStatus.PUBLISHED, QuestionStatus.REJECTED, QuestionStatus.ARCHIVED] } },
    include: { translations: true, options: { include: { translations: true } } },
  });

  const counts: Record<string, number> = {};
  let changed = 0;

  for (const q of questions) {
    const status = evaluateLanguageStatus(q);
    counts[status] = (counts[status] ?? 0) + 1;
    if (status !== q.status) {
      await prisma.question.update({ where: { id: q.id }, data: { status } });
      changed++;
    }
  }

  console.log(`Evaluated ${questions.length} questions (excluding already PUBLISHED/REJECTED/ARCHIVED).`);
  console.log(`Updated status on ${changed} rows.`);
  console.log('Resulting status distribution among evaluated rows:', counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

/**
 * One-time, idempotent: marks the pre-existing questions (created before the
 * bilingual-enforcement migration) as isLegacyGrandfathered=true and
 * recomputes their servingEligibility to LEGACY_TEMPORARY (never touching
 * status - that stays whatever evaluateLanguageStatus already set it to via
 * backfill-question-status.ts). Also marks the pre-existing tests as
 * bilingualRequired=false so their current (non-bilingual) question
 * composition stays truthful, rather than the new default of true applying
 * retroactively to rows that already violate it.
 *
 * Safe to run repeatedly: only ever touches rows not already marked.
 */
import { PrismaClient, QuestionServingEligibility, QuestionStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Every question that exists right now, before this migration/backfill
  // pass, is legacy content by definition - there is no other source yet
  // (no admin has created a question through the new bilingual-gated flow).
  const legacyResult = await prisma.question.updateMany({
    where: { isLegacyGrandfathered: false },
    data: { isLegacyGrandfathered: true },
  });
  console.log(`Marked ${legacyResult.count} questions as isLegacyGrandfathered=true.`);

  // Recompute servingEligibility now that isLegacyGrandfathered is set -
  // PUBLISHED stays FULLY_ELIGIBLE, REJECTED/ARCHIVED stay NOT_ELIGIBLE,
  // everything else becomes LEGACY_TEMPORARY (temporary, time-boxed).
  const toPublishedEligible = await prisma.question.updateMany({
    where: { status: QuestionStatus.PUBLISHED },
    data: { servingEligibility: QuestionServingEligibility.FULLY_ELIGIBLE },
  });
  const toNotEligible = await prisma.question.updateMany({
    where: { status: { in: [QuestionStatus.REJECTED, QuestionStatus.ARCHIVED] } },
    data: { servingEligibility: QuestionServingEligibility.NOT_ELIGIBLE },
  });
  const toLegacyTemporary = await prisma.question.updateMany({
    where: {
      isLegacyGrandfathered: true,
      status: {
        notIn: [QuestionStatus.PUBLISHED, QuestionStatus.REJECTED, QuestionStatus.ARCHIVED],
      },
    },
    data: { servingEligibility: QuestionServingEligibility.LEGACY_TEMPORARY },
  });

  console.log(`servingEligibility -> FULLY_ELIGIBLE: ${toPublishedEligible.count}`);
  console.log(`servingEligibility -> NOT_ELIGIBLE: ${toNotEligible.count}`);
  console.log(`servingEligibility -> LEGACY_TEMPORARY: ${toLegacyTemporary.count}`);

  // Pre-existing tests keep their real (non-bilingual-required) behavior -
  // the new default of true only applies to tests created from now on.
  const testsResult = await prisma.test.updateMany({
    where: {}, // every test that exists right now predates this feature
    data: { bilingualRequired: false },
  });
  console.log(`Marked ${testsResult.count} existing tests as bilingualRequired=false.`);

  const liveTestsResult = await prisma.liveTest.updateMany({
    where: {},
    data: { bilingualRequired: false },
  });
  console.log(`Marked ${liveTestsResult.count} existing live tests as bilingualRequired=false.`);

  const distribution = await prisma.question.groupBy({
    by: ['status', 'servingEligibility'],
    _count: true,
  });
  console.log('Final distribution:', JSON.stringify(distribution, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

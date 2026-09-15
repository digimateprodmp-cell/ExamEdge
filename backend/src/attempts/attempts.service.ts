import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AttemptStatus, Language, Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { StartAttemptDto, SaveAnswerDto } from './dto/attempt.dto';

type TranslatedRow = {
  language: Language;
  text: string;
  explanation?: string | null;
};

function pickText(translations: TranslatedRow[], language: Language): string {
  const exact = translations.find((t) => t.language === language);
  if (exact) return exact.text;
  const fallback = translations[0];
  return fallback ? fallback.text : '';
}

function pickExplanation(
  translations: TranslatedRow[],
  language: Language,
): string | null {
  const exact = translations.find((t) => t.language === language);
  if (exact?.explanation) return exact.explanation;
  const fallback = translations.find((t) => t.explanation);
  return fallback?.explanation ?? null;
}

const TEST_QUESTIONS_INCLUDE = {
  testQuestions: {
    orderBy: { order: 'asc' as const },
    include: {
      question: {
        include: {
          translations: true,
          options: {
            include: { translations: true },
            orderBy: { order: 'asc' as const },
          },
        },
      },
    },
  },
};

@Injectable()
export class AttemptsService {
  private readonly logger = new Logger(AttemptsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async loadOwnedAttempt(userId: string, attemptId: string) {
    const attempt = await this.prisma.testAttempt.findUnique({
      where: { id: attemptId },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.userId !== userId)
      throw new ForbiddenException('Not your attempt');
    return attempt;
  }

  private serializeForAttempt(
    test: Prisma.TestGetPayload<{ include: typeof TEST_QUESTIONS_INCLUDE }>,
    language: Language,
    answersByTestQuestionId: Map<
      string,
      { selectedOptionId: string | null; isMarkedForReview: boolean }
    >,
    revealAnswers: boolean,
  ) {
    return test.testQuestions.map((tq) => {
      const q = tq.question;
      const savedAnswer = answersByTestQuestionId.get(tq.id);
      return {
        testQuestionId: tq.id,
        questionId: q.id,
        order: tq.order,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        text: pickText(q.translations, language),
        explanation: revealAnswers
          ? pickExplanation(q.translations, language)
          : null,
        options: q.options.map((o) => ({
          id: o.id,
          text: pickText(o.translations, language),
          isCorrect: revealAnswers ? o.isCorrect : undefined,
        })),
        selectedOptionId: savedAnswer?.selectedOptionId ?? null,
        isMarkedForReview: savedAnswer?.isMarkedForReview ?? false,
      };
    });
  }

  async start(userId: string, dto: StartAttemptDto) {
    const test = await this.prisma.test.findFirstOrThrow({
      where: { id: dto.testId, deletedAt: null, status: 'PUBLISHED' },
      include: TEST_QUESTIONS_INCLUDE,
    });

    if (test.testQuestions.length === 0) {
      throw new BadRequestException('This test has no questions yet');
    }

    const now = new Date();
    if (test.type === 'LIVE') {
      if (test.startAt && now < test.startAt) {
        throw new BadRequestException('This live test has not started yet');
      }
      if (test.endAt && now > test.endAt) {
        throw new BadRequestException('This live test window has closed');
      }
    }

    const existing = await this.prisma.testAttempt.findFirst({
      where: { userId, testId: test.id, status: 'IN_PROGRESS' },
      orderBy: { createdAt: 'desc' },
    });

    let attempt = existing;
    if (attempt && attempt.expiresAt <= now) {
      await this.finalize(attempt.id, 'AUTO_SUBMITTED');
      attempt = null;
    }

    if (!attempt) {
      attempt = await this.prisma.testAttempt.create({
        data: {
          userId,
          testId: test.id,
          language: dto.language ?? Language.EN,
          expiresAt: new Date(now.getTime() + test.durationMinutes * 60_000),
        },
      });
    }

    return this.getForStudent(userId, attempt.id);
  }

  /**
   * `displayLanguage` is an optional per-request override so the student can
   * toggle EN/HI while taking the test without losing progress or restarting
   * the attempt — the attempt's stored `language` (set at start) is only the
   * default and is never mutated by this.
   */
  async getForStudent(
    userId: string,
    attemptId: string,
    displayLanguage?: Language,
  ) {
    const attempt = await this.loadOwnedAttempt(userId, attemptId);
    const language = displayLanguage ?? attempt.language;

    const test = await this.prisma.test.findUniqueOrThrow({
      where: { id: attempt.testId },
      include: TEST_QUESTIONS_INCLUDE,
    });

    const answers = await this.prisma.testAnswer.findMany({
      where: { attemptId: attempt.id },
    });
    const answersByTestQuestionId = new Map(
      answers.map((a) => [
        a.testQuestionId,
        {
          selectedOptionId: a.selectedOptionId,
          isMarkedForReview: a.isMarkedForReview,
        },
      ]),
    );

    return {
      id: attempt.id,
      testId: attempt.testId,
      status: attempt.status,
      language,
      startedAt: attempt.startedAt,
      expiresAt: attempt.expiresAt,
      submittedAt: attempt.submittedAt,
      durationMinutes: test.durationMinutes,
      title:
        language === Language.HI && test.titleHi ? test.titleHi : test.titleEn,
      score: attempt.score,
      correctCount: attempt.correctCount,
      incorrectCount: attempt.incorrectCount,
      unattemptedCount: attempt.unattemptedCount,
      timeTakenSeconds: attempt.timeTakenSeconds,
      questions: this.serializeForAttempt(
        test,
        language,
        answersByTestQuestionId,
        attempt.status !== 'IN_PROGRESS',
      ),
    };
  }

  async saveAnswer(
    userId: string,
    attemptId: string,
    testQuestionId: string,
    dto: SaveAnswerDto,
  ) {
    const attempt = await this.loadOwnedAttempt(userId, attemptId);

    if (attempt.status !== 'IN_PROGRESS') {
      throw new BadRequestException('This attempt has already been submitted');
    }
    if (attempt.expiresAt <= new Date()) {
      await this.finalize(attempt.id, 'AUTO_SUBMITTED');
      throw new BadRequestException(
        'Time is up; this attempt has been auto-submitted',
      );
    }

    const testQuestion = await this.prisma.testQuestion.findFirst({
      where: { id: testQuestionId, testId: attempt.testId },
    });
    if (!testQuestion)
      throw new NotFoundException('Question not part of this test');

    await this.prisma.testAnswer.upsert({
      where: { attemptId_testQuestionId: { attemptId, testQuestionId } },
      create: {
        attemptId,
        testQuestionId,
        selectedOptionId: dto.selectedOptionId ?? undefined,
        isMarkedForReview: dto.isMarkedForReview ?? false,
        answeredAt: dto.selectedOptionId ? new Date() : null,
      },
      update: {
        ...(dto.selectedOptionId !== undefined
          ? { selectedOptionId: dto.selectedOptionId }
          : {}),
        ...(dto.isMarkedForReview !== undefined
          ? { isMarkedForReview: dto.isMarkedForReview }
          : {}),
        ...(dto.selectedOptionId ? { answeredAt: new Date() } : {}),
      },
    });

    return { saved: true };
  }

  async submit(userId: string, attemptId: string) {
    const attempt = await this.loadOwnedAttempt(userId, attemptId);
    if (attempt.status !== 'IN_PROGRESS') {
      return this.getResult(userId, attemptId);
    }
    await this.finalize(attemptId, 'SUBMITTED');
    return this.getResult(userId, attemptId);
  }

  async getResult(
    userId: string,
    attemptId: string,
    displayLanguage?: Language,
  ) {
    const attempt = await this.loadOwnedAttempt(userId, attemptId);
    if (attempt.status === 'IN_PROGRESS') {
      throw new BadRequestException('Attempt is still in progress');
    }
    return this.getForStudent(userId, attemptId, displayLanguage);
  }

  async listMine(userId: string, testId?: string) {
    return this.prisma.testAttempt.findMany({
      where: { userId, ...(testId ? { testId } : {}) },
      orderBy: { createdAt: 'desc' },
      include: {
        test: { select: { titleEn: true, titleHi: true, type: true } },
      },
    });
  }

  /**
   * The only place a score is ever written. Always recomputed server-side
   * from QuestionOption.isCorrect — a client can never supply or influence
   * the score, correct/incorrect counts, or marks awarded.
   */
  private async finalize(
    attemptId: string,
    status: 'SUBMITTED' | 'AUTO_SUBMITTED',
  ) {
    const attempt = await this.prisma.testAttempt.findUniqueOrThrow({
      where: { id: attemptId },
    });
    if (attempt.status !== 'IN_PROGRESS') return;

    const testQuestions = await this.prisma.testQuestion.findMany({
      where: { testId: attempt.testId },
      include: { question: true },
    });

    const answers = await this.prisma.testAnswer.findMany({
      where: { attemptId },
    });
    const answerByTestQuestionId = new Map(
      answers.map((a) => [a.testQuestionId, a]),
    );

    const correctOptions = await this.prisma.questionOption.findMany({
      where: {
        questionId: { in: testQuestions.map((tq) => tq.questionId) },
        isCorrect: true,
      },
    });
    const correctOptionIdByQuestionId = new Map(
      correctOptions.map((o) => [o.questionId, o.id]),
    );

    let score = new Prisma.Decimal(0);
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;

    const updates: {
      id: string;
      isCorrect: boolean | null;
      marksAwarded: Prisma.Decimal;
    }[] = [];

    for (const tq of testQuestions) {
      const answer = answerByTestQuestionId.get(tq.id);
      if (!answer || !answer.selectedOptionId) {
        unattemptedCount++;
        continue;
      }

      const isCorrect =
        correctOptionIdByQuestionId.get(tq.questionId) ===
        answer.selectedOptionId;
      const marksAwarded = isCorrect
        ? new Prisma.Decimal(tq.question.marks)
        : new Prisma.Decimal(tq.question.negativeMarks).negated();

      score = score.plus(marksAwarded);
      if (isCorrect) correctCount++;
      else incorrectCount++;

      updates.push({ id: answer.id, isCorrect, marksAwarded });
    }

    await this.prisma.$transaction([
      ...updates.map((u) =>
        this.prisma.testAnswer.update({
          where: { id: u.id },
          data: { isCorrect: u.isCorrect, marksAwarded: u.marksAwarded },
        }),
      ),
      this.prisma.testAttempt.update({
        where: { id: attemptId },
        data: {
          status,
          submittedAt: new Date(),
          score,
          correctCount,
          incorrectCount,
          unattemptedCount,
          timeTakenSeconds: Math.floor(
            (Date.now() - attempt.startedAt.getTime()) / 1000,
          ),
        },
      }),
    ]);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async autoSubmitExpiredAttempts() {
    const expired = await this.prisma.testAttempt.findMany({
      where: { status: 'IN_PROGRESS', expiresAt: { lte: new Date() } },
      select: { id: true },
      take: 200,
    });

    for (const { id } of expired) {
      try {
        await this.finalize(id, AttemptStatus.AUTO_SUBMITTED);
      } catch (err) {
        this.logger.error(`Failed to auto-submit attempt ${id}`, err as Error);
      }
    }
  }
}

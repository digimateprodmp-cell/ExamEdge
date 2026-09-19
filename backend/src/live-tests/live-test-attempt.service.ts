import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LiveAttemptStatus, Language } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { AttemptsService } from '../attempts/attempts.service';
import { LiveTestStateService } from './live-test-state.service';
import { LiveTestsService } from './live-tests.service';
import { SaveAnswerDto } from '../attempts/dto/attempt.dto';

@Injectable()
export class LiveTestAttemptService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attemptsService: AttemptsService,
    private readonly stateService: LiveTestStateService,
    private readonly liveTestsService: LiveTestsService,
  ) {}

  /**
   * Join (or rejoin) a Live Test. The underlying TestAttempt's expiresAt is
   * always the live test's fixed endAt — never `now + duration` — so a late
   * entrant provably gets only the remaining time, never a fresh full
   * duration, and a rejoining student resumes the same attempt/timer.
   */
  async join(userId: string, liveTestId: string, language?: Language) {
    const liveTest = await this.prisma.liveTest.findUnique({
      where: { id: liveTestId },
      include: { test: true },
    });
    if (!liveTest) throw new NotFoundException('Live test not found');

    const now = new Date();
    if (!this.stateService.canJoin(liveTest, now)) {
      throw new BadRequestException(
        'This live test is not currently open for joining',
      );
    }

    const existing = await this.prisma.liveTestAttempt.findUnique({
      where: { liveTestId_userId: { liveTestId, userId } },
    });
    if (existing) {
      if (existing.status === LiveAttemptStatus.TERMINATED_FOR_VIOLATION) {
        throw new ForbiddenException(
          'This attempt was terminated for an integrity violation and cannot be resumed',
        );
      }
      return this.getState(userId, existing.id);
    }

    const testQuestionCount = await this.prisma.testQuestion.count({
      where: { testId: liveTest.testId },
    });
    if (testQuestionCount === 0) {
      throw new BadRequestException('This live test has no questions yet');
    }

    const liveTestAttempt = await this.prisma.$transaction(async (tx) => {
      const testAttempt = await tx.testAttempt.create({
        data: {
          userId,
          testId: liveTest.testId,
          language: language ?? Language.EN,
          expiresAt: liveTest.endAt,
        },
      });
      return tx.liveTestAttempt.create({
        data: {
          liveTestId,
          userId,
          testAttemptId: testAttempt.id,
          status: LiveAttemptStatus.IN_PROGRESS,
          joinedAt: now,
        },
      });
    });

    await this.liveTestsService.audit(liveTestId, userId, 'STUDENT_JOINED', {
      liveTestAttemptId: liveTestAttempt.id,
    });

    return this.getState(userId, liveTestAttempt.id);
  }

  async getState(userId: string, liveTestAttemptId: string) {
    const liveTestAttempt = await this.loadOwned(userId, liveTestAttemptId);
    const questionPayload = await this.attemptsService.getForStudent(
      userId,
      liveTestAttempt.testAttemptId,
    );
    const liveTest = await this.prisma.liveTest.findUniqueOrThrow({
      where: { id: liveTestAttempt.liveTestId },
      include: { integrityPolicy: true },
    });

    return {
      liveTestAttemptId: liveTestAttempt.id,
      liveTestId: liveTestAttempt.liveTestId,
      status: liveTestAttempt.status,
      integrityWarningCount: liveTestAttempt.integrityWarningCount,
      joinedAt: liveTestAttempt.joinedAt,
      integrityPolicyConfig: liveTest.integrityPolicy?.config ?? null,
      attempt: questionPayload,
    };
  }

  async saveAnswer(
    userId: string,
    liveTestAttemptId: string,
    testQuestionId: string,
    dto: SaveAnswerDto,
  ) {
    const liveTestAttempt = await this.loadOwned(userId, liveTestAttemptId);
    if (liveTestAttempt.status !== LiveAttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('This attempt is no longer in progress');
    }
    return this.attemptsService.saveAnswer(
      userId,
      liveTestAttempt.testAttemptId,
      testQuestionId,
      dto,
    );
  }

  async submit(userId: string, liveTestAttemptId: string) {
    const liveTestAttempt = await this.loadOwned(userId, liveTestAttemptId);
    if (liveTestAttempt.status === LiveAttemptStatus.TERMINATED_FOR_VIOLATION) {
      return this.attemptsService.getResult(
        userId,
        liveTestAttempt.testAttemptId,
      );
    }

    const result = await this.attemptsService.submit(
      userId,
      liveTestAttempt.testAttemptId,
    );

    if (liveTestAttempt.status === LiveAttemptStatus.IN_PROGRESS) {
      await this.prisma.liveTestAttempt.update({
        where: { id: liveTestAttempt.id },
        data: { status: LiveAttemptStatus.SUBMITTED },
      });
    }

    return result;
  }

  async listMine(userId: string) {
    return this.prisma.liveTestAttempt.findMany({
      where: { userId },
      include: {
        liveTest: {
          select: { title: true, startAt: true, endAt: true, status: true },
        },
        testAttempt: {
          select: { status: true, score: true, submittedAt: true },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });
  }

  private async loadOwned(userId: string, liveTestAttemptId: string) {
    const liveTestAttempt = await this.prisma.liveTestAttempt.findUnique({
      where: { id: liveTestAttemptId },
    });
    if (!liveTestAttempt) throw new NotFoundException('Attempt not found');
    if (liveTestAttempt.userId !== userId) {
      throw new ForbiddenException('Not your attempt');
    }
    return liveTestAttempt;
  }
}

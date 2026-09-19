import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { LiveAttemptStatus, LiveTestStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { LiveTestStateService } from './live-test-state.service';
import { AttemptsService } from '../attempts/attempts.service';
import { CreateLiveTestDto, UpdateLiveTestDto } from './dto/live-test.dto';

const SCHEDULE_SELECT = {
  startAt: true,
  endAt: true,
  status: true,
  resultVisibility: true,
  resultVisibleAt: true,
} as const;

@Injectable()
export class LiveTestsService {
  private readonly logger = new Logger(LiveTestsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stateService: LiveTestStateService,
    private readonly attemptsService: AttemptsService,
  ) {}

  private withComputedStatus<
    T extends {
      startAt: Date;
      endAt: Date;
      status: LiveTestStatus;
      resultVisibility: any;
      resultVisibleAt: Date | null;
    },
  >(liveTest: T) {
    return {
      ...liveTest,
      status: this.stateService.computeStatus(liveTest),
    };
  }

  async findAllPublic(examCycleId?: string) {
    const liveTests = await this.prisma.liveTest.findMany({
      where: {
        status: { not: LiveTestStatus.CANCELLED },
        ...(examCycleId ? { examCycleId } : {}),
      },
      include: {
        test: {
          select: { titleEn: true, titleHi: true, durationMinutes: true },
        },
      },
      orderBy: { startAt: 'asc' },
    });
    return liveTests.map((lt) => this.withComputedStatus(lt));
  }

  async findOnePublic(id: string) {
    const liveTest = await this.prisma.liveTest.findUnique({
      where: { id },
      include: {
        test: {
          select: { titleEn: true, titleHi: true, durationMinutes: true },
        },
        integrityPolicy: true,
        slots: true,
      },
    });
    if (!liveTest) throw new NotFoundException('Live test not found');
    return this.withComputedStatus(liveTest);
  }

  async findAllAdmin() {
    const liveTests = await this.prisma.liveTest.findMany({
      include: {
        test: { select: { titleEn: true } },
        _count: { select: { attempts: true, slots: true } },
      },
      orderBy: { startAt: 'desc' },
    });
    return liveTests.map((lt) => this.withComputedStatus(lt));
  }

  async findOneAdmin(id: string) {
    const liveTest = await this.prisma.liveTest.findUnique({
      where: { id },
      include: {
        test: true,
        integrityPolicy: true,
        slots: true,
        auditLogs: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });
    if (!liveTest) throw new NotFoundException('Live test not found');

    const participantCounts = await this.prisma.liveTestAttempt.groupBy({
      by: ['status'],
      where: { liveTestId: id },
      _count: true,
    });

    return {
      ...this.withComputedStatus(liveTest),
      participantCounts: participantCounts.map((p) => ({
        status: p.status,
        count: p._count,
      })),
    };
  }

  async create(actorId: string, dto: CreateLiveTestDto) {
    const liveTest = await this.prisma.liveTest.create({
      data: {
        title: dto.title,
        examCycleId: dto.examCycleId,
        testId: dto.testId,
        startAt: new Date(dto.startAt),
        endAt: new Date(dto.endAt),
        durationMinutes: dto.durationMinutes,
        timezone: dto.timezone ?? 'Asia/Kolkata',
        allowLateEntry: dto.allowLateEntry ?? false,
        lateEntryCutoffAt: dto.lateEntryCutoffAt
          ? new Date(dto.lateEntryCutoffAt)
          : undefined,
        isFree: dto.isFree ?? true,
        price: dto.price ?? 0,
        instructions: dto.instructions,
        integrityPolicyId: dto.integrityPolicyId,
        resultVisibility: dto.resultVisibility,
        resultVisibleAt: dto.resultVisibleAt
          ? new Date(dto.resultVisibleAt)
          : undefined,
        randomizeQuestions: dto.randomizeQuestions ?? false,
        createdById: actorId,
      },
    });

    await this.audit(liveTest.id, actorId, 'CREATED', { title: dto.title });
    return liveTest;
  }

  async update(actorId: string, id: string, dto: UpdateLiveTestDto) {
    await this.assertExists(id);
    const liveTest = await this.prisma.liveTest.update({
      where: { id },
      data: {
        ...dto,
        startAt: dto.startAt ? new Date(dto.startAt) : undefined,
        endAt: dto.endAt ? new Date(dto.endAt) : undefined,
        lateEntryCutoffAt: dto.lateEntryCutoffAt
          ? new Date(dto.lateEntryCutoffAt)
          : undefined,
        resultVisibleAt: dto.resultVisibleAt
          ? new Date(dto.resultVisibleAt)
          : undefined,
      },
    });
    await this.audit(id, actorId, 'UPDATED', { fields: Object.keys(dto) });
    return liveTest;
  }

  async cancel(actorId: string, id: string) {
    await this.assertExists(id);
    const liveTest = await this.prisma.liveTest.update({
      where: { id },
      data: { status: LiveTestStatus.CANCELLED },
    });
    await this.audit(id, actorId, 'CANCELLED');
    return liveTest;
  }

  async publish(actorId: string, id: string) {
    const liveTest = await this.assertExists(id);
    if (liveTest.startAt <= new Date()) {
      throw new BadRequestException(
        'Cannot publish a live test scheduled in the past',
      );
    }
    await this.audit(id, actorId, 'PUBLISHED');
    return this.withComputedStatus(liveTest);
  }

  private async assertExists(id: string) {
    const liveTest = await this.prisma.liveTest.findUnique({ where: { id } });
    if (!liveTest) throw new NotFoundException('Live test not found');
    return liveTest;
  }

  async audit(
    liveTestId: string | null,
    actorId: string | null,
    action: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.prisma.liveTestAuditLog.create({
      data: { liveTestId, actorId, action, metadata },
    });
  }

  /**
   * Persists the computed status (for admin filtering/queries) and drives
   * side effects: auto-submits any still-IN_PROGRESS LiveTestAttempt whose
   * live test just ended. Runs every 10s — the API itself never trusts this
   * persisted column for authorization, only for display/filtering.
   */
  @Cron('*/10 * * * * *')
  async sweep() {
    const active = await this.prisma.liveTest.findMany({
      where: { status: { notIn: [LiveTestStatus.CANCELLED] } },
      select: SCHEDULE_SELECT_WITH_ID,
    });

    const now = new Date();
    for (const lt of active) {
      const computed = this.stateService.computeStatus(lt, now);
      if (computed !== lt.status) {
        await this.prisma.liveTest.update({
          where: { id: lt.id },
          data: { status: computed },
        });
      }

      if (
        computed === LiveTestStatus.ENDED ||
        computed === LiveTestStatus.RESULTS_AVAILABLE
      ) {
        await this.autoSubmitEndedAttempts(lt.id);
      }
    }
  }

  private async autoSubmitEndedAttempts(liveTestId: string) {
    const stuck = await this.prisma.liveTestAttempt.findMany({
      where: { liveTestId, status: LiveAttemptStatus.IN_PROGRESS },
      select: { id: true, testAttemptId: true },
      take: 200,
    });

    for (const attempt of stuck) {
      try {
        await this.attemptsService.forceFinalize(
          attempt.testAttemptId,
          'AUTO_SUBMITTED',
        );
        await this.prisma.liveTestAttempt.update({
          where: { id: attempt.id },
          data: { status: LiveAttemptStatus.AUTO_SUBMITTED },
        });
      } catch (err) {
        this.logger.error(
          `Failed to auto-submit live test attempt ${attempt.id}`,
          err as Error,
        );
      }
    }
  }
}

const SCHEDULE_SELECT_WITH_ID = {
  id: true,
  ...SCHEDULE_SELECT,
} as const;

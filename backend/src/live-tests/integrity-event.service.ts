import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  IntegrityAction,
  IntegrityEventType,
  IntegritySeverity,
  LiveAttemptStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { AttemptsService } from '../attempts/attempts.service';

export interface IntegrityPolicyConfig {
  blockedShortcuts?: string[];
  blockCopy?: boolean;
  blockPaste?: boolean;
  blockPrint?: boolean;
  blockDevTools?: boolean;
  blockTextSelection?: boolean;
  tabSwitchPolicy?: {
    firstAction?: 'WARNING' | 'TERMINATED' | 'LOGGED';
    secondAction?: 'WARNING' | 'TERMINATED' | 'LOGGED';
  };
}

const LOW_SEVERITY_EVENTS = new Set<IntegrityEventType>([
  IntegrityEventType.CONNECTION_LOST,
  IntegrityEventType.CONNECTION_RESTORED,
]);

@Injectable()
export class IntegrityEventService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attemptsService: AttemptsService,
  ) {}

  /**
   * Records a raw client-reported event and returns the SERVER-DECIDED
   * action. The client only ever renders what comes back here — it never
   * counts its own violations. First matching violation -> WARNING,
   * second -> TERMINATED, backed by a real audit row every time (never a
   * boolean flag).
   */
  async recordEvent(
    userId: string,
    liveTestAttemptId: string,
    eventType: IntegrityEventType,
    keyCombination?: string,
    browserInfo?: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    const attempt = await this.prisma.liveTestAttempt.findUnique({
      where: { id: liveTestAttemptId },
      include: { liveTest: { include: { integrityPolicy: true } } },
    });
    if (!attempt) throw new NotFoundException('Live test attempt not found');
    if (attempt.userId !== userId) {
      throw new ForbiddenException('Not your attempt');
    }

    if (attempt.status === LiveAttemptStatus.TERMINATED_FOR_VIOLATION) {
      return {
        action: IntegrityAction.TERMINATED,
        warningCount: attempt.integrityWarningCount,
        alreadyTerminated: true,
      };
    }

    const isLowSeverity = LOW_SEVERITY_EVENTS.has(eventType);
    const severity = isLowSeverity
      ? IntegritySeverity.LOW
      : IntegritySeverity.MEDIUM;

    if (isLowSeverity) {
      await this.prisma.examIntegrityEvent.create({
        data: {
          liveTestAttemptId,
          userId,
          liveTestId: attempt.liveTestId,
          eventType,
          keyCombination,
          browserInfo,
          metadata,
          severity,
          actionTaken: IntegrityAction.LOGGED,
        },
      });
      return {
        action: IntegrityAction.LOGGED,
        warningCount: attempt.integrityWarningCount,
      };
    }

    // Count prior escalated violations for THIS attempt — a real DB query
    // every time, never a client-supplied or in-memory boolean.
    const priorViolationCount = await this.prisma.examIntegrityEvent.count({
      where: {
        liveTestAttemptId,
        actionTaken: {
          in: [IntegrityAction.WARNING, IntegrityAction.TERMINATED],
        },
      },
    });

    const action =
      priorViolationCount === 0
        ? IntegrityAction.WARNING
        : IntegrityAction.TERMINATED;

    await this.prisma.examIntegrityEvent.create({
      data: {
        liveTestAttemptId,
        userId,
        liveTestId: attempt.liveTestId,
        eventType,
        keyCombination,
        browserInfo,
        metadata,
        severity:
          action === IntegrityAction.TERMINATED
            ? IntegritySeverity.HIGH
            : severity,
        actionTaken: action,
      },
    });

    if (action === IntegrityAction.WARNING) {
      await this.prisma.liveTestAttempt.update({
        where: { id: liveTestAttemptId },
        data: { integrityWarningCount: { increment: 1 } },
      });
      return { action, warningCount: attempt.integrityWarningCount + 1 };
    }

    // TERMINATED: flip attempt status and force-submit whatever was saved.
    await this.prisma.liveTestAttempt.update({
      where: { id: liveTestAttemptId },
      data: { status: LiveAttemptStatus.TERMINATED_FOR_VIOLATION },
    });
    await this.attemptsService.forceFinalize(
      attempt.testAttemptId,
      'AUTO_SUBMITTED',
    );

    await this.prisma.liveTestAuditLog.create({
      data: {
        liveTestId: attempt.liveTestId,
        actorId: userId,
        action: 'ATTEMPT_TERMINATED_FOR_VIOLATION',
        metadata: { liveTestAttemptId, eventType },
      },
    });

    return {
      action,
      warningCount: attempt.integrityWarningCount,
      terminated: true,
    };
  }
}

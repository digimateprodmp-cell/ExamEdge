import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  BookingStatus,
  LiveTestStatus,
  NotificationType,
} from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationsService } from './notifications.service';

const SWEEP_WINDOW_MINUTES = 5;

/**
 * Evaluates admin-configurable NotificationRule offsets (never hardcoded
 * 24h/1h/15m constants) against upcoming LiveTests and creates due
 * notifications. Idempotent by checking for an existing notification with
 * the same (userId, entityId, type) before creating — safe against the
 * sweep firing more than once inside the same due window.
 */
@Injectable()
export class NotificationSchedulerService {
  private readonly logger = new Logger(NotificationSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async sweep() {
    const rules = await this.prisma.notificationRule.findMany({
      where: {
        isActive: true,
        type: {
          in: [
            NotificationType.LIVE_TEST_REMINDER,
            NotificationType.LIVE_TEST_SCHEDULE,
          ],
        },
      },
    });
    if (rules.length === 0) return;

    for (const rule of rules) {
      try {
        await this.evaluateRule(
          rule.id,
          rule.type,
          rule.offsetMinutesBeforeEvent,
        );
      } catch (err) {
        this.logger.error(`Notification rule ${rule.id} failed`, err as Error);
      }
    }
  }

  private async evaluateRule(
    ruleId: string,
    type: NotificationType,
    offsetMinutes: number,
  ) {
    const now = new Date();
    const dueFrom = new Date(now.getTime() + offsetMinutes * 60_000);
    const dueTo = new Date(dueFrom.getTime() + SWEEP_WINDOW_MINUTES * 60_000);

    const liveTests = await this.prisma.liveTest.findMany({
      where: {
        status: { not: LiveTestStatus.CANCELLED },
        startAt: { gte: dueFrom, lt: dueTo },
      },
      select: { id: true, title: true, startAt: true, examCycleId: true },
    });

    for (const liveTest of liveTests) {
      const recipientIds = await this.resolveRecipients(
        liveTest.id,
        liveTest.examCycleId,
      );
      for (const userId of recipientIds) {
        const already = await this.prisma.notification.findFirst({
          where: {
            userId,
            entityType: 'LiveTest',
            entityId: liveTest.id,
            type,
          },
        });
        if (already) continue;

        await this.notificationsService.create(
          userId,
          type,
          'Upcoming Live Test',
          `${liveTest.title} starts at ${liveTest.startAt.toISOString()}`,
          {
            entityType: 'LiveTest',
            entityId: liveTest.id,
            actionUrl: `/live-tests/${liveTest.id}`,
          },
        );
      }
    }
  }

  private async resolveRecipients(
    liveTestId: string,
    examCycleId: string | null,
  ) {
    const fromBookings = await this.prisma.slotBooking.findMany({
      where: { status: BookingStatus.CONFIRMED, slot: { liveTestId } },
      select: { userId: true },
    });

    const fromProfiles = examCycleId
      ? await this.prisma.studentExamProfile.findMany({
          where: { examCycleId, isActive: true },
          select: { userId: true },
        })
      : [];

    return Array.from(
      new Set([...fromBookings, ...fromProfiles].map((r) => r.userId)),
    );
  }
}

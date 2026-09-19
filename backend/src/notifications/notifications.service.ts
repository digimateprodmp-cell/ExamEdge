import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

// Critical types students can never disable, enforced here (not just hidden in the UI).
const NON_DISABLEABLE_TYPES = new Set<NotificationType>([
  NotificationType.PAYMENT,
  NotificationType.LIVE_TEST_SCHEDULE,
  NotificationType.LIVE_TEST_CANCELLED,
]);

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    opts?: {
      entityType?: string;
      entityId?: string;
      actionUrl?: string;
      expiresAt?: Date;
    },
  ) {
    if (!NON_DISABLEABLE_TYPES.has(type)) {
      const pref = await this.prisma.notificationPreference.findUnique({
        where: { userId_type: { userId, type } },
      });
      if (pref && !pref.enabled) return null;
    }

    return this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        entityType: opts?.entityType,
        entityId: opts?.entityId,
        actionUrl: opts?.actionUrl,
        expiresAt: opts?.expiresAt,
      },
    });
  }

  listMine(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  unreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, readAt: null } });
  }

  async markRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification || notification.userId !== userId) return null;
    if (notification.readAt) return notification;
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  listPreferences(userId: string) {
    return this.prisma.notificationPreference.findMany({ where: { userId } });
  }

  async setPreference(
    userId: string,
    type: NotificationType,
    enabled: boolean,
  ) {
    if (NON_DISABLEABLE_TYPES.has(type) && !enabled) {
      // Silently ignore attempts to disable a critical type rather than
      // erroring — the UI should already prevent this from being offered.
      enabled = true;
    }
    return this.prisma.notificationPreference.upsert({
      where: { userId_type: { userId, type } },
      create: { userId, type, enabled },
      update: { enabled },
    });
  }
}

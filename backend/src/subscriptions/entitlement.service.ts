import { Injectable } from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

export interface EntitlementCheck {
  examId?: string;
  kind: 'LIVE_TEST' | 'PRACTICE' | 'AI';
}

export interface EntitlementResult {
  entitled: boolean;
  subscriptionId?: string;
  reason?: string;
}

/**
 * The single choke point for "is this student allowed to do X". Never a
 * raw `student.subscription = true` read — always a live query against an
 * active, unexpired Subscription + its plan's entitlement rows.
 */
@Injectable()
export class EntitlementService {
  constructor(private readonly prisma: PrismaService) {}

  async check(
    userId: string,
    req: EntitlementCheck,
  ): Promise<EntitlementResult> {
    const now = new Date();
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        startAt: { lte: now },
        endAt: { gte: now },
      },
      include: { plan: { include: { entitlements: true } } },
      orderBy: { endAt: 'desc' },
    });

    if (!subscription) {
      return { entitled: false, reason: 'No active subscription' };
    }

    const entitlements = subscription.plan.entitlements;
    if (entitlements.length === 0) {
      // A plan with no entitlement rows at all grants blanket access.
      return { entitled: true, subscriptionId: subscription.id };
    }

    const matching = entitlements.find(
      (e) => !e.examId || e.examId === req.examId,
    );
    if (!matching) {
      return { entitled: false, reason: 'Plan does not cover this exam' };
    }

    if (
      req.kind === 'LIVE_TEST' &&
      matching.liveTestsLimit !== null &&
      matching.liveTestsLimit !== undefined
    ) {
      const usedCount = await this.prisma.liveTestAttempt.count({
        where: { userId, createdAt: { gte: subscription.startAt } },
      });
      if (usedCount >= matching.liveTestsLimit) {
        return {
          entitled: false,
          reason: 'Live test limit reached for this plan',
        };
      }
    }

    return { entitled: true, subscriptionId: subscription.id };
  }
}

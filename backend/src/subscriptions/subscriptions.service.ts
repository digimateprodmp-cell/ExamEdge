import { Injectable, NotFoundException } from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreateEntitlementDto,
  CreatePlanDto,
  UpdatePlanDto,
} from './dto/subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllPlansPublic() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      include: { entitlements: true },
      orderBy: { priceMonthly: 'asc' },
    });
  }

  findAllPlansAdmin() {
    return this.prisma.subscriptionPlan.findMany({
      include: { entitlements: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  createPlan(dto: CreatePlanDto) {
    return this.prisma.subscriptionPlan.create({ data: dto });
  }

  async updatePlan(id: string, dto: UpdatePlanDto) {
    await this.assertPlanExists(id);
    return this.prisma.subscriptionPlan.update({ where: { id }, data: dto });
  }

  async addEntitlement(planId: string, dto: CreateEntitlementDto) {
    await this.assertPlanExists(planId);
    return this.prisma.planEntitlement.create({ data: { planId, ...dto } });
  }

  removeEntitlement(id: string) {
    return this.prisma.planEntitlement.delete({ where: { id } });
  }

  private async assertPlanExists(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });
    if (!plan) throw new NotFoundException('Subscription plan not found');
  }

  myActiveSubscription(userId: string) {
    return this.prisma.subscription.findFirst({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        endAt: { gte: new Date() },
      },
      include: { plan: { include: { entitlements: true } } },
      orderBy: { endAt: 'desc' },
    });
  }

  listAllAdmin() {
    return this.prisma.subscription.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        plan: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  /** Admin-granted or payment-confirmed subscription creation. */
  grant(userId: string, planId: string, months: number) {
    const startAt = new Date();
    const endAt = new Date(startAt);
    endAt.setMonth(endAt.getMonth() + months);

    return this.prisma.subscription.create({
      data: {
        userId,
        planId,
        startAt,
        endAt,
        status: SubscriptionStatus.ACTIVE,
      },
    });
  }
}

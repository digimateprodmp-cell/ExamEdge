import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CouponType, Prisma, PaymentItemType } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCouponDto, UpdateCouponDto } from './dto/coupon.dto';

export interface CouponComputation {
  coupon: { id: string; code: string };
  discount: number;
  finalAmount: number;
}

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveItemPrice(
    itemType: PaymentItemType,
    itemId: string,
  ): Promise<number> {
    switch (itemType) {
      case PaymentItemType.COURSE: {
        const item = await this.prisma.course.findFirstOrThrow({
          where: { id: itemId },
        });
        return Number(item.price);
      }
      case PaymentItemType.TEST_SERIES: {
        const item = await this.prisma.testSeries.findFirstOrThrow({
          where: { id: itemId },
        });
        return Number(item.price);
      }
      case PaymentItemType.BATCH: {
        const item = await this.prisma.batch.findFirstOrThrow({
          where: { id: itemId },
        });
        return Number(item.price);
      }
      case PaymentItemType.NOTE_VOLUME: {
        const item = await this.prisma.noteVolume.findFirstOrThrow({
          where: { id: itemId },
        });
        return Number(item.price);
      }
      case PaymentItemType.SLOT_BOOKING: {
        // itemId is a SlotReservation id; price is fixed by the parent LiveTest.
        const reservation = await this.prisma.slotReservation.findFirstOrThrow({
          where: { id: itemId },
          include: { slot: { include: { liveTest: true } } },
        });
        return Number(reservation.slot.liveTest.price);
      }
      default:
        throw new BadRequestException('Unsupported item type');
    }
  }

  async validateAndCompute(
    code: string,
    userId: string,
    itemType: PaymentItemType,
    itemId: string,
  ): Promise<CouponComputation> {
    const baseAmount = await this.resolveItemPrice(itemType, itemId);
    const coupon = await this.prisma.coupon.findUnique({ where: { code } });

    if (!coupon || !coupon.isActive || coupon.deletedAt) {
      throw new NotFoundException('Invalid coupon code');
    }

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validTo) {
      throw new BadRequestException('This coupon is not currently valid');
    }

    if (coupon.minPurchase && baseAmount < Number(coupon.minPurchase)) {
      throw new BadRequestException(
        `Minimum purchase of ${coupon.minPurchase} required for this coupon`,
      );
    }

    const applicableTo = coupon.applicableTo as { itemIds?: string[] } | null;
    if (
      applicableTo?.itemIds?.length &&
      !applicableTo.itemIds.includes(itemId)
    ) {
      throw new BadRequestException(
        'This coupon is not applicable to this item',
      );
    }

    if (coupon.usageLimit) {
      const totalUsage = await this.prisma.couponUsage.count({
        where: { couponId: coupon.id },
      });
      if (totalUsage >= coupon.usageLimit) {
        throw new BadRequestException(
          'This coupon has reached its usage limit',
        );
      }
    }

    const userUsage = await this.prisma.couponUsage.count({
      where: { couponId: coupon.id, userId },
    });
    if (userUsage >= coupon.perUserLimit) {
      throw new BadRequestException(
        'You have already used this coupon the maximum number of times',
      );
    }

    let discount =
      coupon.type === CouponType.PERCENT
        ? (baseAmount * Number(coupon.value)) / 100
        : Number(coupon.value);

    if (coupon.maxDiscount) {
      discount = Math.min(discount, Number(coupon.maxDiscount));
    }
    discount = Math.min(discount, baseAmount);

    return {
      coupon: { id: coupon.id, code: coupon.code },
      discount: Math.round(discount * 100) / 100,
      finalAmount: Math.round((baseAmount - discount) * 100) / 100,
    };
  }

  recordUsage(
    tx: Prisma.TransactionClient,
    couponId: string,
    userId: string,
    paymentId: string,
    discountApplied: number,
  ) {
    return tx.couponUsage.create({
      data: { couponId, userId, paymentId, discountApplied },
    });
  }

  findAllAdmin() {
    return this.prisma.coupon.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  findAllAvailable() {
    const now = new Date();
    return this.prisma.coupon.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        validFrom: { lte: now },
        validTo: { gte: now },
      },
      orderBy: { validTo: 'asc' },
    });
  }

  myUsageHistory(userId: string) {
    return this.prisma.couponUsage.findMany({
      where: { userId },
      include: { coupon: true },
      orderBy: { usedAt: 'desc' },
    });
  }

  create(dto: CreateCouponDto) {
    const { applicableItemIds, ...rest } = dto;
    return this.prisma.coupon.create({
      data: {
        ...rest,
        validFrom: new Date(dto.validFrom),
        validTo: new Date(dto.validTo),
        applicableTo: applicableItemIds
          ? { itemIds: applicableItemIds }
          : Prisma.JsonNull,
      },
    });
  }

  update(id: string, dto: UpdateCouponDto) {
    const { applicableItemIds, ...rest } = dto;
    return this.prisma.coupon.update({
      where: { id },
      data: {
        ...rest,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        applicableTo: applicableItemIds
          ? { itemIds: applicableItemIds }
          : undefined,
      },
    });
  }

  remove(id: string) {
    return this.prisma.coupon.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

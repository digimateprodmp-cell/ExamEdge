import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';
import {
  EnrollmentSource,
  PaymentItemType,
  PaymentStatus,
} from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CouponsService } from '../coupons/coupons.service';
import { CreateOrderDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly couponsService: CouponsService,
  ) {}

  private getRazorpayClient(): Razorpay {
    const keyId = this.config.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET');
    if (!keyId || !keySecret) {
      throw new ServiceUnavailableException(
        'Payments are not configured yet. Set RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET.',
      );
    }
    return new Razorpay({ key_id: keyId, key_secret: keySecret });
  }

  async createOrder(userId: string, dto: CreateOrderDto) {
    const baseAmount = await this.couponsService.resolveItemPrice(
      dto.itemType,
      dto.itemId,
    );

    let finalAmount = baseAmount;
    let couponId: string | undefined;

    if (dto.couponCode) {
      const computed = await this.couponsService.validateAndCompute(
        dto.couponCode,
        userId,
        dto.itemType,
        dto.itemId,
      );
      finalAmount = computed.finalAmount;
      couponId = computed.coupon.id;
    }

    if (finalAmount <= 0) {
      // Fully covered by a coupon or an already-free item: enroll directly, no gateway needed.
      const payment = await this.prisma.payment.create({
        data: {
          userId,
          razorpayOrderId: `FREE-${crypto.randomUUID()}`,
          amount: 0,
          status: PaymentStatus.PAID,
          itemType: dto.itemType,
          itemId: dto.itemId,
          couponId,
        },
      });
      await this.grantEnrollment(userId, dto.itemType, dto.itemId);
      return { free: true, payment };
    }

    const razorpay = this.getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: Math.round(finalAmount * 100),
      currency: 'INR',
      notes: { userId, itemType: dto.itemType, itemId: dto.itemId },
    });

    await this.prisma.payment.create({
      data: {
        userId,
        razorpayOrderId: order.id,
        amount: finalAmount,
        status: PaymentStatus.CREATED,
        itemType: dto.itemType,
        itemId: dto.itemId,
        couponId,
      },
    });

    return {
      free: false,
      orderId: order.id,
      amount: finalAmount,
      currency: 'INR',
      keyId: this.config.get<string>('RAZORPAY_KEY_ID'),
    };
  }

  async verifyPayment(
    userId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { razorpayOrderId },
    });
    if (!payment || payment.userId !== userId) {
      throw new NotFoundException('Payment not found');
    }
    if (payment.status === PaymentStatus.PAID) {
      return payment;
    }

    const keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET');
    if (!keySecret) {
      throw new ServiceUnavailableException('Payments are not configured yet.');
    }

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      });
      throw new BadRequestException('Payment signature verification failed');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PAID,
          razorpayPaymentId,
          razorpaySignature,
        },
      });

      if (payment.couponId) {
        await this.couponsService.recordUsage(
          tx,
          payment.couponId,
          userId,
          payment.id,
          Number(payment.amount),
        );
      }
    });

    await this.grantEnrollment(userId, payment.itemType, payment.itemId);

    return this.prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
  }

  listMine(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  listAllAdmin() {
    return this.prisma.payment.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        coupon: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  private async grantEnrollment(
    userId: string,
    itemType: PaymentItemType,
    itemId: string,
  ) {
    let expiresAt: Date | undefined;

    if (itemType === PaymentItemType.TEST_SERIES) {
      const testSeries = await this.prisma.testSeries.findUnique({
        where: { id: itemId },
      });
      if (testSeries) {
        expiresAt = new Date(
          Date.now() + testSeries.validityDays * 24 * 60 * 60 * 1000,
        );
      }
    }

    await this.prisma.enrollment.create({
      data: {
        userId,
        source: EnrollmentSource.PURCHASE,
        expiresAt,
        courseId: itemType === PaymentItemType.COURSE ? itemId : undefined,
        testSeriesId:
          itemType === PaymentItemType.TEST_SERIES ? itemId : undefined,
        batchId: itemType === PaymentItemType.BATCH ? itemId : undefined,
        noteVolumeId:
          itemType === PaymentItemType.NOTE_VOLUME ? itemId : undefined,
      },
    });
  }
}

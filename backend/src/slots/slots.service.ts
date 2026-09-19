import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingStatus, ReservationStatus, SlotStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateSlotDto, UpdateSlotDto } from './dto/slot.dto';

const RESERVATION_WINDOW_MINUTES = 15;

@Injectable()
export class SlotsService {
  private readonly logger = new Logger(SlotsService.name);

  constructor(private readonly prisma: PrismaService) {}

  listForLiveTest(liveTestId: string) {
    return this.prisma.testSlot.findMany({
      where: { liveTestId },
      orderBy: { startAt: 'asc' },
    });
  }

  async create(actorId: string, liveTestId: string, dto: CreateSlotDto) {
    const liveTest = await this.prisma.liveTest.findUnique({
      where: { id: liveTestId },
    });
    if (!liveTest) throw new NotFoundException('Live test not found');

    return this.prisma.testSlot.create({
      data: {
        liveTestId,
        startAt: new Date(dto.startAt),
        endAt: new Date(dto.endAt),
        timezone: dto.timezone ?? 'Asia/Kolkata',
        capacity: dto.capacity,
        bookingOpenAt: dto.bookingOpenAt
          ? new Date(dto.bookingOpenAt)
          : undefined,
        bookingCloseAt: dto.bookingCloseAt
          ? new Date(dto.bookingCloseAt)
          : undefined,
        createdById: actorId,
      },
    });
  }

  async update(id: string, dto: UpdateSlotDto) {
    await this.assertExists(id);
    return this.prisma.testSlot.update({
      where: { id },
      data: {
        ...dto,
        startAt: dto.startAt ? new Date(dto.startAt) : undefined,
        endAt: dto.endAt ? new Date(dto.endAt) : undefined,
        bookingOpenAt: dto.bookingOpenAt
          ? new Date(dto.bookingOpenAt)
          : undefined,
        bookingCloseAt: dto.bookingCloseAt
          ? new Date(dto.bookingCloseAt)
          : undefined,
      },
    });
  }

  async cancel(id: string) {
    await this.assertExists(id);
    return this.prisma.testSlot.update({
      where: { id },
      data: { status: SlotStatus.CANCELLED },
    });
  }

  private async assertExists(id: string) {
    const slot = await this.prisma.testSlot.findUnique({ where: { id } });
    if (!slot) throw new NotFoundException('Slot not found');
    return slot;
  }

  async reserve(userId: string, slotId: string) {
    const slot = await this.prisma.testSlot.findUnique({
      where: { id: slotId },
    });
    if (!slot) throw new NotFoundException('Slot not found');

    const now = new Date();
    if (slot.status === SlotStatus.CANCELLED) {
      throw new BadRequestException('This slot has been cancelled');
    }
    if (slot.bookingOpenAt && now < slot.bookingOpenAt) {
      throw new BadRequestException('Booking has not opened for this slot yet');
    }
    if (slot.bookingCloseAt && now > slot.bookingCloseAt) {
      throw new BadRequestException('Booking has closed for this slot');
    }

    const existingActive = await this.prisma.slotReservation.findFirst({
      where: {
        slotId,
        userId,
        status: {
          in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED],
        },
      },
    });
    if (existingActive) return existingActive;

    const existingBooking = await this.prisma.slotBooking.findUnique({
      where: { slotId_userId: { slotId, userId } },
    });
    if (existingBooking) {
      throw new ConflictException('You already have a booking for this slot');
    }

    return this.prisma.$transaction(async (tx) => {
      // Atomic, capacity-safe seat claim: the WHERE guard means only one of
      // N concurrent transactions racing for the last seat gets count === 1.
      const claim = await tx.testSlot.updateMany({
        where: { id: slotId, bookedCount: { lt: slot.capacity } },
        data: { bookedCount: { increment: 1 } },
      });
      if (claim.count === 0) {
        throw new ConflictException('This slot is fully booked');
      }

      const updatedSlot = await tx.testSlot.findUniqueOrThrow({
        where: { id: slotId },
      });
      if (updatedSlot.bookedCount >= updatedSlot.capacity) {
        await tx.testSlot.update({
          where: { id: slotId },
          data: { status: SlotStatus.FULL },
        });
      }

      return tx.slotReservation.create({
        data: {
          slotId,
          userId,
          status: ReservationStatus.PENDING,
          expiresAt: new Date(
            now.getTime() + RESERVATION_WINDOW_MINUTES * 60_000,
          ),
        },
      });
    });
  }

  /**
   * Directly books a seat for an already-entitled (subscribed) student —
   * no payment/reservation hold needed, but still goes through the same
   * atomic capacity guard.
   */
  async bookDirect(userId: string, slotId: string, subscriptionId: string) {
    const slot = await this.prisma.testSlot.findUnique({
      where: { id: slotId },
    });
    if (!slot) throw new NotFoundException('Slot not found');
    if (slot.status === SlotStatus.CANCELLED) {
      throw new BadRequestException('This slot has been cancelled');
    }

    const existingBooking = await this.prisma.slotBooking.findUnique({
      where: { slotId_userId: { slotId, userId } },
    });
    if (existingBooking) return existingBooking;

    return this.prisma.$transaction(async (tx) => {
      const claim = await tx.testSlot.updateMany({
        where: { id: slotId, bookedCount: { lt: slot.capacity } },
        data: { bookedCount: { increment: 1 } },
      });
      if (claim.count === 0) {
        throw new ConflictException('This slot is fully booked');
      }

      const updatedSlot = await tx.testSlot.findUniqueOrThrow({
        where: { id: slotId },
      });
      if (updatedSlot.bookedCount >= updatedSlot.capacity) {
        await tx.testSlot.update({
          where: { id: slotId },
          data: { status: SlotStatus.FULL },
        });
      }

      return tx.slotBooking.create({
        data: {
          slotId,
          userId,
          subscriptionId,
          status: BookingStatus.CONFIRMED,
        },
      });
    });
  }

  /** Called by PaymentsService once a SLOT_BOOKING payment is verified. */
  async confirmReservation(reservationId: string, paymentId: string) {
    const reservation = await this.prisma.slotReservation.findUnique({
      where: { id: reservationId },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');
    if (reservation.status === ReservationStatus.CONFIRMED) {
      return this.prisma.slotBooking.findUnique({ where: { reservationId } });
    }
    if (reservation.status !== ReservationStatus.PENDING) {
      throw new BadRequestException('This reservation is no longer active');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.slotReservation.update({
        where: { id: reservationId },
        data: { status: ReservationStatus.CONFIRMED, paymentId },
      });
      return tx.slotBooking.create({
        data: {
          slotId: reservation.slotId,
          userId: reservation.userId,
          reservationId: reservation.id,
          paymentId,
          status: BookingStatus.CONFIRMED,
        },
      });
    });
  }

  listMyBookings(userId: string) {
    return this.prisma.slotBooking.findMany({
      where: { userId, status: BookingStatus.CONFIRMED },
      include: {
        slot: {
          include: { liveTest: { select: { title: true, testId: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Releases expired PENDING reservations (abandoned payments) and frees
   * their seats atomically — decrements bookedCount and reopens the slot
   * if it had been marked FULL. Runs on the same cron cadence as the rest
   * of the platform's sweeps.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async releaseExpiredReservations() {
    const expired = await this.prisma.slotReservation.findMany({
      where: {
        status: ReservationStatus.PENDING,
        expiresAt: { lte: new Date() },
      },
      take: 200,
    });

    for (const reservation of expired) {
      try {
        await this.prisma.$transaction(async (tx) => {
          const updated = await tx.slotReservation.updateMany({
            where: { id: reservation.id, status: ReservationStatus.PENDING },
            data: { status: ReservationStatus.EXPIRED },
          });
          if (updated.count === 0) return; // already confirmed/handled concurrently

          await tx.testSlot.update({
            where: { id: reservation.slotId },
            data: {
              bookedCount: { decrement: 1 },
              status: SlotStatus.OPEN,
            },
          });
        });
      } catch (err) {
        this.logger.error(
          `Failed to release expired reservation ${reservation.id}`,
          err as Error,
        );
      }
    }
  }
}

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { SlotsService } from './slots.service';
import { EntitlementService } from '../subscriptions/entitlement.service';
import { CreateSlotDto, UpdateSlotDto } from './dto/slot.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@Controller()
export class SlotsController {
  constructor(
    private readonly slotsService: SlotsService,
    private readonly entitlementService: EntitlementService,
  ) {}

  @Public()
  @Get('live-tests/:liveTestId/slots')
  listForLiveTest(@Param('liveTestId') liveTestId: string) {
    return this.slotsService.listForLiveTest(liveTestId);
  }

  @Roles(Role.ADMIN)
  @Post('live-tests/:liveTestId/slots')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('liveTestId') liveTestId: string,
    @Body() dto: CreateSlotDto,
  ) {
    return this.slotsService.create(user.id, liveTestId, dto);
  }

  @Roles(Role.ADMIN)
  @Patch('slots/:id')
  update(@Param('id') id: string, @Body() dto: UpdateSlotDto) {
    return this.slotsService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Post('slots/:id/cancel')
  cancel(@Param('id') id: string) {
    return this.slotsService.cancel(id);
  }

  @Get('bookings/mine')
  listMyBookings(@CurrentUser() user: AuthenticatedUser) {
    return this.slotsService.listMyBookings(user.id);
  }

  /**
   * Entitlement is decided server-side only: a subscribed student books
   * directly; a non-subscribed student gets a temporary reservation and
   * must complete payment — the client never sends a `paymentRequired` flag.
   */
  @HttpCode(HttpStatus.OK)
  @Post('slots/:id/reserve')
  async reserveOrBook(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') slotId: string,
  ) {
    const entitlement = await this.entitlementService.check(user.id, {
      kind: 'LIVE_TEST',
    });
    if (entitlement.entitled && entitlement.subscriptionId) {
      const booking = await this.slotsService.bookDirect(
        user.id,
        slotId,
        entitlement.subscriptionId,
      );
      return { requiresPayment: false, booking };
    }

    const reservation = await this.slotsService.reserve(user.id, slotId);
    return { requiresPayment: true, reservation };
  }
}

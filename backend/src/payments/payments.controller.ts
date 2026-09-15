import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { CreateOrderDto, VerifyPaymentDto } from './dto/payment.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('history')
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.listMine(user.id);
  }

  @Roles(Role.ADMIN)
  @Get('admin')
  listAllAdmin() {
    return this.paymentsService.listAllAdmin();
  }

  @HttpCode(HttpStatus.OK)
  @Post('orders')
  createOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOrderDto,
  ) {
    return this.paymentsService.createOrder(user.id, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('verify')
  verify(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: VerifyPaymentDto,
  ) {
    return this.paymentsService.verifyPayment(
      user.id,
      dto.razorpayOrderId,
      dto.razorpayPaymentId,
      dto.razorpaySignature,
    );
  }
}

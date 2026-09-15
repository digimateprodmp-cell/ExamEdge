import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentItemType } from '@prisma/client';

export class CreateOrderDto {
  @IsEnum(PaymentItemType)
  itemType!: PaymentItemType;

  @IsString()
  itemId!: string;

  @IsOptional()
  @IsString()
  couponCode?: string;
}

export class VerifyPaymentDto {
  @IsString()
  razorpayOrderId!: string;

  @IsString()
  razorpayPaymentId!: string;

  @IsString()
  razorpaySignature!: string;
}

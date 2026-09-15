import { PartialType } from '@nestjs/mapped-types';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { CouponType, PaymentItemType } from '@prisma/client';

export class CreateCouponDto {
  @IsString()
  code!: string;

  @IsEnum(CouponType)
  type!: CouponType;

  @IsNumber()
  @Min(0)
  value!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPurchase?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  perUserLimit?: number;

  @IsDateString()
  validFrom!: string;

  @IsDateString()
  validTo!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  applicableItemIds?: string[];
}

export class UpdateCouponDto extends PartialType(CreateCouponDto) {}

export class ValidateCouponDto {
  @IsString()
  code!: string;

  @IsEnum(PaymentItemType)
  itemType!: PaymentItemType;

  @IsString()
  itemId!: string;
}

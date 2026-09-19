import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePlanDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  priceMonthly!: number;

  @IsNumber()
  @Min(0)
  priceYearly!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePlanDto extends PartialType(CreatePlanDto) {}

export class GrantSubscriptionDto {
  @IsString()
  userId!: string;

  @IsString()
  planId!: string;

  @IsInt()
  @Min(1)
  months!: number;
}

export class CreateEntitlementDto {
  @IsOptional()
  @IsString()
  examId?: string;

  @IsOptional()
  @IsInt()
  liveTestsLimit?: number;

  @IsOptional()
  @IsInt()
  practiceTestsLimit?: number;

  @IsOptional()
  @IsInt()
  aiQuestionsPerMonth?: number;
}

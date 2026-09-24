import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Prisma, ResultVisibility } from '@prisma/client';

export class CreateLiveTestDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  examCycleId?: string;

  @IsString()
  testId!: string;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;

  @IsInt()
  @Min(1)
  durationMinutes!: number;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsBoolean()
  allowLateEntry?: boolean;

  @IsOptional()
  @IsDateString()
  lateEntryCutoffAt?: string;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsString()
  integrityPolicyId?: string;

  @IsOptional()
  @IsEnum(ResultVisibility)
  resultVisibility?: ResultVisibility;

  @IsOptional()
  @IsDateString()
  resultVisibleAt?: string;

  @IsOptional()
  @IsBoolean()
  randomizeQuestions?: boolean;

  @IsOptional()
  @IsBoolean()
  bilingualRequired?: boolean;
}

export class UpdateLiveTestDto extends PartialType(CreateLiveTestDto) {}

export class RecordIntegrityEventDto {
  @IsString()
  eventType!: string;

  @IsOptional()
  @IsString()
  keyCombination?: string;

  @IsOptional()
  @IsString()
  browserInfo?: string;

  @IsOptional()
  metadata?: Prisma.InputJsonValue;
}

export class CreateIntegrityPolicyDto {
  @IsString()
  name!: string;

  @IsOptional()
  config?: Prisma.InputJsonValue;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { TestStatus, TestType } from '@prisma/client';

export class CreateTestDto {
  @IsString()
  testVolumeId!: string;

  @IsString()
  titleEn!: string;

  @IsOptional()
  @IsString()
  titleHi?: string;

  @IsOptional()
  @IsString()
  instructionsEn?: string;

  @IsOptional()
  @IsString()
  instructionsHi?: string;

  @IsOptional()
  @IsEnum(TestType)
  type?: TestType;

  @IsOptional()
  @IsEnum(TestStatus)
  status?: TestStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  marksPerQuestion?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  negativeMarks?: number;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsOptional()
  @IsBoolean()
  bilingualRequired?: boolean;
}

export class UpdateTestDto extends PartialType(CreateTestDto) {}

export class AddTestQuestionDto {
  @IsString()
  questionId!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

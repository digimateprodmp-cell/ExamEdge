import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ExamCategory } from '@prisma/client';

export class CreateExamDto {
  @IsString()
  nameEn!: string;

  @IsOptional()
  @IsString()
  nameHi?: string;

  @IsString()
  slug!: string;

  @IsOptional()
  @IsEnum(ExamCategory)
  category?: ExamCategory;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateExamDto extends PartialType(CreateExamDto) {}

export class CreateExamCycleDto {
  @IsInt()
  year!: number;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateExamCycleDto extends PartialType(CreateExamCycleDto) {}

export class CreateSyllabusVersionDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateSyllabusTopicDto {
  @IsString()
  topicId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  weight?: number;
}

import { PartialType } from '@nestjs/mapped-types';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { Difficulty, Language, PrepStatus } from '@prisma/client';

export class AddExamProfileDto {
  @IsString()
  examCycleId!: string;

  @IsOptional()
  @IsInt()
  targetYear?: number;

  @IsOptional()
  @IsEnum(Language)
  preferredLanguage?: Language;

  @IsOptional()
  @IsEnum(Difficulty)
  preferredDifficulty?: Difficulty;

  @IsOptional()
  @IsDateString()
  targetExamDate?: string;
}

export class UpdateExamProfileDto extends PartialType(AddExamProfileDto) {
  @IsOptional()
  @IsEnum(PrepStatus)
  prepStatus?: PrepStatus;
}

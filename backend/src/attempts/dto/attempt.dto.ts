import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Language } from '@prisma/client';

export class StartAttemptDto {
  @IsString()
  testId!: string;

  @IsOptional()
  @IsEnum(Language)
  language?: Language;
}

export class SaveAnswerDto {
  @IsOptional()
  @IsString()
  selectedOptionId?: string | null;

  @IsOptional()
  @IsBoolean()
  isMarkedForReview?: boolean;
}

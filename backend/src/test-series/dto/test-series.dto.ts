import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateTestSeriesDto {
  @IsOptional()
  @IsString()
  courseId?: string;

  @IsString()
  titleEn!: string;

  @IsOptional()
  @IsString()
  titleHi?: string;

  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @IsOptional()
  @IsString()
  descriptionHi?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  validityDays?: number;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateTestSeriesDto extends PartialType(CreateTestSeriesDto) {}

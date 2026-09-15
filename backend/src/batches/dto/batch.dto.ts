import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateBatchDto {
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

export class UpdateBatchDto extends PartialType(CreateBatchDto) {}

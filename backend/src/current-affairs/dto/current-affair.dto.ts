import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateCurrentAffairDto {
  @IsDateString()
  date!: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsString()
  titleEn?: string;

  @IsOptional()
  @IsString()
  titleHi?: string;

  @IsOptional()
  @IsString()
  contentEn?: string;

  @IsOptional()
  @IsString()
  contentHi?: string;
}

export class UpdateCurrentAffairDto extends PartialType(
  CreateCurrentAffairDto,
) {}

export class CreateCurrentAffairCategoryDto {
  @IsString()
  nameEn!: string;

  @IsOptional()
  @IsString()
  nameHi?: string;
}

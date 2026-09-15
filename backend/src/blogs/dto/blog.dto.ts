import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateBlogDto {
  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

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
  excerptEn?: string;

  @IsOptional()
  @IsString()
  excerptHi?: string;

  @IsOptional()
  @IsString()
  contentEn?: string;

  @IsOptional()
  @IsString()
  contentHi?: string;
}

export class UpdateBlogDto extends PartialType(CreateBlogDto) {}

export class CreateBlogCategoryDto {
  @IsString()
  nameEn!: string;

  @IsOptional()
  @IsString()
  nameHi?: string;
}

import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateVideoDto {
  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  batchId?: string;

  @IsString()
  titleEn!: string;

  @IsOptional()
  @IsString()
  titleHi?: string;

  @IsString()
  videoUrl!: string;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationSeconds?: number;
}

export class UpdateVideoDto extends PartialType(CreateVideoDto) {}

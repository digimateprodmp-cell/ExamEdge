import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateNoteVolumeDto {
  @IsOptional()
  @IsString()
  courseId?: string;

  @IsString()
  titleEn!: string;

  @IsOptional()
  @IsString()
  titleHi?: string;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;
}

export class UpdateNoteVolumeDto extends PartialType(CreateNoteVolumeDto) {}

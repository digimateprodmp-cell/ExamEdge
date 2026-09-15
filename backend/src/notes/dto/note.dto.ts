import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  noteVolumeId!: string;

  @IsString()
  titleEn!: string;

  @IsOptional()
  @IsString()
  titleHi?: string;

  @IsString()
  fileUrl!: string;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;
}

export class UpdateNoteDto extends PartialType(CreateNoteDto) {}

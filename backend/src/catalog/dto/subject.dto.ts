import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  nameEn!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  nameHi?: string;
}

export class UpdateSubjectDto extends PartialType(CreateSubjectDto) {}

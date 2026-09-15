import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTopicDto {
  @IsString()
  subjectId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(150)
  nameEn!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  nameHi?: string;
}

export class UpdateTopicDto extends PartialType(CreateTopicDto) {}

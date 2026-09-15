import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateTestVolumeDto {
  @IsString()
  testSeriesId!: string;

  @IsString()
  titleEn!: string;

  @IsOptional()
  @IsString()
  titleHi?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class UpdateTestVolumeDto extends PartialType(CreateTestVolumeDto) {}

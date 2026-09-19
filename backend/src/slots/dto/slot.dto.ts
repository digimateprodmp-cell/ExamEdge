import { PartialType } from '@nestjs/mapped-types';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateSlotDto {
  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsInt()
  @Min(1)
  capacity!: number;

  @IsOptional()
  @IsDateString()
  bookingOpenAt?: string;

  @IsOptional()
  @IsDateString()
  bookingCloseAt?: string;
}

export class UpdateSlotDto extends PartialType(CreateSlotDto) {}

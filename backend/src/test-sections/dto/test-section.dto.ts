import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateTestSectionDto {
  @IsString()
  @MinLength(1)
  titleEn!: string;

  @IsOptional()
  @IsString()
  titleHi?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  questionLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  marksPerQuestion?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  negativeMarks?: number;
}

export class UpdateTestSectionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  titleEn?: string;

  @IsOptional()
  @IsString()
  titleHi?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  questionLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  marksPerQuestion?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  negativeMarks?: number;
}

export class AddSectionQuestionsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @Type(() => String)
  questionIds!: string[];
}

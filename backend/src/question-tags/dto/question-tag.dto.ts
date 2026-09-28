import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateQuestionTagDto {
  @IsString()
  @MinLength(1)
  nameEn!: string;

  @IsOptional()
  @IsString()
  nameHi?: string;
}

export class UpdateQuestionTagDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  nameEn?: string;

  @IsOptional()
  @IsString()
  nameHi?: string;
}

import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { NotificationType } from '@prisma/client';

export class SetPreferenceDto {
  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsBoolean()
  enabled!: boolean;
}

export class CreateNotificationRuleDto {
  @IsString()
  name!: string;

  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsInt()
  @Min(0)
  offsetMinutesBeforeEvent!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

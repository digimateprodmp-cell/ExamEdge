import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { CoinTxnType } from '@prisma/client';

export class AdminAdjustCoinsDto {
  @IsString()
  userId!: string;

  @IsEnum(CoinTxnType)
  type!: CoinTxnType;

  @IsInt()
  @Min(1)
  amount!: number;

  @IsString()
  reason!: string;
}

export class ListCoinTransactionsQuery {
  @IsOptional()
  @IsEnum(CoinTxnType)
  type?: CoinTxnType;
}

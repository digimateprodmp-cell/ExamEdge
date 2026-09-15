import { BadRequestException, Injectable } from '@nestjs/common';
import { CoinTxnType } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { AdminAdjustCoinsDto } from './dto/coin.dto';

@Injectable()
export class CoinsService {
  constructor(private readonly prisma: PrismaService) {}

  async getBalance(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { coinBalance: true },
    });
    return { balance: user.coinBalance };
  }

  listTransactions(userId: string, type?: CoinTxnType) {
    return this.prisma.coinTransaction.findMany({
      where: { userId, ...(type ? { type } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async adminAdjust(dto: AdminAdjustCoinsDto) {
    if (dto.type === CoinTxnType.DEBIT) {
      const user = await this.prisma.user.findUniqueOrThrow({
        where: { id: dto.userId },
      });
      if (user.coinBalance < dto.amount) {
        throw new BadRequestException(
          'User does not have enough coins for this debit',
        );
      }
    }

    const delta = dto.type === CoinTxnType.CREDIT ? dto.amount : -dto.amount;

    const [transaction] = await this.prisma.$transaction([
      this.prisma.coinTransaction.create({
        data: {
          userId: dto.userId,
          type: dto.type,
          amount: dto.amount,
          reason: dto.reason,
          refType: 'AdminAdjustment',
        },
      }),
      this.prisma.user.update({
        where: { id: dto.userId },
        data: { coinBalance: { increment: delta } },
      }),
    ]);

    return transaction;
  }
}

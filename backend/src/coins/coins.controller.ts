import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { CoinTxnType, Role } from '@prisma/client';
import { CoinsService } from './coins.service';
import { AdminAdjustCoinsDto } from './dto/coin.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@Controller('coins')
export class CoinsController {
  constructor(private readonly coinsService: CoinsService) {}

  @Get('balance')
  getBalance(@CurrentUser() user: AuthenticatedUser) {
    return this.coinsService.getBalance(user.id);
  }

  @Get('transactions')
  listTransactions(
    @CurrentUser() user: AuthenticatedUser,
    @Query('type') type?: CoinTxnType,
  ) {
    return this.coinsService.listTransactions(user.id, type);
  }

  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Post('admin/adjust')
  adminAdjust(@Body() dto: AdminAdjustCoinsDto) {
    return this.coinsService.adminAdjust(dto);
  }
}

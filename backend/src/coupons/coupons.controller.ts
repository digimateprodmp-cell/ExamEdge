import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CouponsService } from './coupons.service';
import {
  CreateCouponDto,
  UpdateCouponDto,
  ValidateCouponDto,
} from './dto/coupon.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get('available')
  findAvailable() {
    return this.couponsService.findAllAvailable();
  }

  @Get('my-usage')
  myUsage(@CurrentUser() user: AuthenticatedUser) {
    return this.couponsService.myUsageHistory(user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Post('validate')
  validate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ValidateCouponDto,
  ) {
    return this.couponsService.validateAndCompute(
      dto.code,
      user.id,
      dto.itemType,
      dto.itemId,
    );
  }

  @Roles(Role.ADMIN)
  @Get('admin')
  findAllAdmin() {
    return this.couponsService.findAllAdmin();
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateCouponDto) {
    return this.couponsService.create(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.couponsService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.couponsService.remove(id);
  }
}

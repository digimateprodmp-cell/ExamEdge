import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { SubscriptionsService } from './subscriptions.service';
import {
  CreateEntitlementDto,
  CreatePlanDto,
  GrantSubscriptionDto,
  UpdatePlanDto,
} from './dto/subscription.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Public()
  @Get('plans')
  findAllPlansPublic() {
    return this.subscriptionsService.findAllPlansPublic();
  }

  @Get('mine')
  myActiveSubscription(@CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionsService.myActiveSubscription(user.id);
  }

  @Roles(Role.ADMIN)
  @Get('plans/admin')
  findAllPlansAdmin() {
    return this.subscriptionsService.findAllPlansAdmin();
  }

  @Roles(Role.ADMIN)
  @Post('plans')
  createPlan(@Body() dto: CreatePlanDto) {
    return this.subscriptionsService.createPlan(dto);
  }

  @Roles(Role.ADMIN)
  @Patch('plans/:id')
  updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.subscriptionsService.updatePlan(id, dto);
  }

  @Roles(Role.ADMIN)
  @Post('plans/:id/entitlements')
  addEntitlement(
    @Param('id') planId: string,
    @Body() dto: CreateEntitlementDto,
  ) {
    return this.subscriptionsService.addEntitlement(planId, dto);
  }

  @Roles(Role.ADMIN)
  @Delete('entitlements/:id')
  removeEntitlement(@Param('id') id: string) {
    return this.subscriptionsService.removeEntitlement(id);
  }

  @Roles(Role.ADMIN)
  @Get('admin')
  listAllAdmin() {
    return this.subscriptionsService.listAllAdmin();
  }

  @Roles(Role.ADMIN)
  @Post('grant')
  grant(@Body() dto: GrantSubscriptionDto) {
    return this.subscriptionsService.grant(dto.userId, dto.planId, dto.months);
  }
}

import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreateNotificationRuleDto,
  SetPreferenceDto,
} from './dto/notification.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.listMine(user.id);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.unreadCount(user.id);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.notificationsService.markRead(user.id, id);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markAllRead(user.id);
  }

  @Get('preferences')
  listPreferences(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.listPreferences(user.id);
  }

  @Patch('preferences')
  setPreference(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SetPreferenceDto,
  ) {
    return this.notificationsService.setPreference(
      user.id,
      dto.type,
      dto.enabled,
    );
  }

  @Roles(Role.ADMIN)
  @Get('rules')
  listRules() {
    return this.prisma.notificationRule.findMany({ orderBy: { name: 'asc' } });
  }

  @Roles(Role.ADMIN)
  @Post('rules')
  createRule(@Body() dto: CreateNotificationRuleDto) {
    return this.prisma.notificationRule.create({ data: dto });
  }

  @Roles(Role.ADMIN)
  @Patch('rules/:id')
  updateRule(
    @Param('id') id: string,
    @Body() dto: Partial<CreateNotificationRuleDto>,
  ) {
    return this.prisma.notificationRule.update({ where: { id }, data: dto });
  }
}

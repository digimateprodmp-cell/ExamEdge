import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('me')
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Delete('me')
  deleteSelf(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.softDeleteSelf(user.id);
  }

  @Roles(Role.ADMIN)
  @Get()
  listUsers(@Query() pagination: PaginationDto) {
    return this.usersService.listUsers(pagination);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  adminUpdateUser(@Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    return this.usersService.adminUpdateUser(id, dto);
  }
}

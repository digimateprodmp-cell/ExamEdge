import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  PaginationDto,
  buildPaginationMeta,
} from '../common/dto/pagination.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';

const PUBLIC_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  state: true,
  avatarUrl: true,
  coinBalance: true,
  isEmailVerified: true,
  isPhoneVerified: true,
  isActive: true,
  referralCode: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: PUBLIC_SELECT,
    });
  }

  async softDeleteSelf(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async listUsers(pagination: PaginationDto) {
    const { page, limit, search } = pagination;
    const where = {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: PUBLIC_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, ...buildPaginationMeta(total, page, limit) };
  }

  async adminUpdateUser(id: string, dto: AdminUpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: PUBLIC_SELECT,
    });
  }
}

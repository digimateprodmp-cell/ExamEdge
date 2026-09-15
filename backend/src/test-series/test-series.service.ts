import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  PaginationDto,
  buildPaginationMeta,
} from '../common/dto/pagination.dto';
import {
  CreateTestSeriesDto,
  UpdateTestSeriesDto,
} from './dto/test-series.dto';

@Injectable()
export class TestSeriesService {
  constructor(private readonly prisma: PrismaService) {}

  private async paginate(pagination: PaginationDto, publicOnly: boolean) {
    const { page, limit, search } = pagination;
    const where = {
      deletedAt: null,
      ...(publicOnly ? { isPublished: true } : {}),
      ...(search ? { titleEn: { contains: search } } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.testSeries.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.testSeries.count({ where }),
    ]);

    return { items, ...buildPaginationMeta(total, page, limit) };
  }

  findAllPublic(pagination: PaginationDto) {
    return this.paginate(pagination, true);
  }

  findAllAdmin(pagination: PaginationDto) {
    return this.paginate(pagination, false);
  }

  findOnePublic(id: string) {
    return this.prisma.testSeries.findFirstOrThrow({
      where: { id, deletedAt: null, isPublished: true },
      include: { volumes: { orderBy: { order: 'asc' } } },
    });
  }

  findOneAdmin(id: string) {
    return this.prisma.testSeries.findFirstOrThrow({
      where: { id, deletedAt: null },
      include: { volumes: { orderBy: { order: 'asc' } } },
    });
  }

  create(dto: CreateTestSeriesDto) {
    return this.prisma.testSeries.create({ data: dto });
  }

  update(id: string, dto: UpdateTestSeriesDto) {
    return this.prisma.testSeries.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.testSeries.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

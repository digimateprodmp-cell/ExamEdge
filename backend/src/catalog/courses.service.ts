import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  PaginationDto,
  buildPaginationMeta,
} from '../common/dto/pagination.dto';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  private async paginate(pagination: PaginationDto, publicOnly: boolean) {
    const { page, limit, search } = pagination;
    const where = {
      deletedAt: null,
      ...(publicOnly ? { isPublished: true } : {}),
      ...(search ? { titleEn: { contains: search } } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.course.count({ where }),
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
    return this.prisma.course.findFirstOrThrow({
      where: { id, deletedAt: null, isPublished: true },
    });
  }

  findOneAdmin(id: string) {
    return this.prisma.course.findFirstOrThrow({
      where: { id, deletedAt: null },
    });
  }

  create(dto: CreateCourseDto) {
    return this.prisma.course.create({ data: dto });
  }

  update(id: string, dto: UpdateCourseDto) {
    return this.prisma.course.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.course.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

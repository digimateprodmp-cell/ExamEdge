import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.subject.findMany({
      include: { topics: true },
      orderBy: { nameEn: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.subject.findUniqueOrThrow({
      where: { id },
      include: { topics: true },
    });
  }

  create(dto: CreateSubjectDto) {
    return this.prisma.subject.create({ data: dto });
  }

  update(id: string, dto: UpdateSubjectDto) {
    return this.prisma.subject.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.subject.delete({ where: { id } });
  }
}

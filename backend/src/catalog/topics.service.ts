import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateTopicDto, UpdateTopicDto } from './dto/topic.dto';

@Injectable()
export class TopicsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(subjectId?: string) {
    return this.prisma.topic.findMany({
      where: subjectId ? { subjectId } : undefined,
      orderBy: { nameEn: 'asc' },
    });
  }

  create(dto: CreateTopicDto) {
    return this.prisma.topic.create({ data: dto });
  }

  update(id: string, dto: UpdateTopicDto) {
    return this.prisma.topic.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.topic.delete({ where: { id } });
  }
}

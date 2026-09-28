import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreateQuestionTagDto,
  UpdateQuestionTagDto,
} from './dto/question-tag.dto';

@Injectable()
export class QuestionTagsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.questionTag.findMany({
      orderBy: { nameEn: 'asc' },
      include: { _count: { select: { assignments: true } } },
    });
  }

  findOne(id: string) {
    return this.prisma.questionTag.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateQuestionTagDto) {
    return this.prisma.questionTag.create({ data: dto });
  }

  update(id: string, dto: UpdateQuestionTagDto) {
    return this.prisma.questionTag.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const inUse = await this.prisma.questionTagAssignment.count({
      where: { questionTagId: id },
    });
    if (inUse > 0) {
      throw new BadRequestException(
        `Cannot delete: this tag is assigned to ${inUse} question(s). Remove it from those questions first.`,
      );
    }
    return this.prisma.questionTag.delete({ where: { id } });
  }
}

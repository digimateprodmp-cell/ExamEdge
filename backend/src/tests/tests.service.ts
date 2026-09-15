import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  AddTestQuestionDto,
  CreateTestDto,
  UpdateTestDto,
} from './dto/test.dto';

@Injectable()
export class TestsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllPublic(testVolumeId?: string) {
    return this.prisma.test.findMany({
      where: {
        deletedAt: null,
        status: 'PUBLISHED',
        ...(testVolumeId ? { testVolumeId } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  findAllAdmin(testVolumeId?: string) {
    return this.prisma.test.findMany({
      where: { deletedAt: null, ...(testVolumeId ? { testVolumeId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOnePublic(id: string) {
    return this.prisma.test.findFirstOrThrow({
      where: { id, deletedAt: null, status: 'PUBLISHED' },
      include: { _count: { select: { testQuestions: true } } },
    });
  }

  findOneAdmin(id: string) {
    return this.prisma.test.findFirstOrThrow({
      where: { id, deletedAt: null },
      include: {
        testQuestions: {
          orderBy: { order: 'asc' },
          include: {
            question: {
              include: {
                translations: true,
                options: { include: { translations: true } },
              },
            },
          },
        },
      },
    });
  }

  create(dto: CreateTestDto) {
    return this.prisma.test.create({ data: dto });
  }

  update(id: string, dto: UpdateTestDto) {
    return this.prisma.test.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.test.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async addQuestion(testId: string, dto: AddTestQuestionDto) {
    const order =
      dto.order ??
      (await this.prisma.testQuestion.count({ where: { testId } }));
    return this.prisma.testQuestion.create({
      data: { testId, questionId: dto.questionId, order },
    });
  }

  removeQuestion(testId: string, questionId: string) {
    return this.prisma.testQuestion.delete({
      where: { testId_questionId: { testId, questionId } },
    });
  }
}

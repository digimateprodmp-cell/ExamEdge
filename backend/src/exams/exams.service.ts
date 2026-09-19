import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreateExamCycleDto,
  CreateExamDto,
  CreateSyllabusTopicDto,
  CreateSyllabusVersionDto,
  UpdateExamCycleDto,
  UpdateExamDto,
} from './dto/exam.dto';

@Injectable()
export class ExamsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Public browse ----

  findAllPublic() {
    return this.prisma.exam.findMany({
      where: { isActive: true },
      include: {
        cycles: {
          where: { isActive: true },
          orderBy: { year: 'desc' },
        },
      },
      orderBy: { nameEn: 'asc' },
    });
  }

  async findCyclesPublic(examId: string) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, isActive: true },
    });
    if (!exam) throw new NotFoundException('Exam not found');
    return this.prisma.examCycle.findMany({
      where: { examId, isActive: true },
      orderBy: { year: 'desc' },
    });
  }

  // ---- Admin CRUD: Exam ----

  findAllAdmin() {
    return this.prisma.exam.findMany({
      include: { cycles: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneAdmin(id: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        cycles: {
          include: { syllabusVersions: { include: { topics: true } } },
        },
      },
    });
    if (!exam) throw new NotFoundException('Exam not found');
    return exam;
  }

  create(dto: CreateExamDto) {
    return this.prisma.exam.create({ data: dto });
  }

  async update(id: string, dto: UpdateExamDto) {
    await this.assertExamExists(id);
    return this.prisma.exam.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.assertExamExists(id);
    return this.prisma.exam.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private async assertExamExists(id: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id } });
    if (!exam) throw new NotFoundException('Exam not found');
  }

  // ---- Admin CRUD: ExamCycle ----

  async createCycle(examId: string, dto: CreateExamCycleDto) {
    await this.assertExamExists(examId);
    return this.prisma.examCycle.create({
      data: { examId, ...dto },
    });
  }

  async updateCycle(id: string, dto: UpdateExamCycleDto) {
    await this.assertCycleExists(id);
    return this.prisma.examCycle.update({ where: { id }, data: dto });
  }

  async removeCycle(id: string) {
    await this.assertCycleExists(id);
    return this.prisma.examCycle.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private async assertCycleExists(id: string) {
    const cycle = await this.prisma.examCycle.findUnique({ where: { id } });
    if (!cycle) throw new NotFoundException('Exam cycle not found');
  }

  // ---- Admin CRUD: SyllabusVersion / SyllabusTopic ----

  async createSyllabusVersion(
    examCycleId: string,
    dto: CreateSyllabusVersionDto,
  ) {
    await this.assertCycleExists(examCycleId);
    return this.prisma.syllabusVersion.create({
      data: { examCycleId, ...dto },
    });
  }

  async addSyllabusTopic(
    syllabusVersionId: string,
    dto: CreateSyllabusTopicDto,
  ) {
    const version = await this.prisma.syllabusVersion.findUnique({
      where: { id: syllabusVersionId },
    });
    if (!version) throw new NotFoundException('Syllabus version not found');

    const topic = await this.prisma.topic.findUnique({
      where: { id: dto.topicId },
    });
    if (!topic) throw new NotFoundException('Topic not found');

    return this.prisma.syllabusTopic.upsert({
      where: {
        syllabusVersionId_topicId: {
          syllabusVersionId,
          topicId: dto.topicId,
        },
      },
      create: {
        syllabusVersionId,
        topicId: dto.topicId,
        weight: dto.weight ?? 1,
      },
      update: { weight: dto.weight ?? 1 },
    });
  }

  async removeSyllabusTopic(syllabusVersionId: string, topicId: string) {
    return this.prisma.syllabusTopic.delete({
      where: { syllabusVersionId_topicId: { syllabusVersionId, topicId } },
    });
  }
}

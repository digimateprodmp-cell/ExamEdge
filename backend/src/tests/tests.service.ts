import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QuestionServingEligibility } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  AddTestQuestionDto,
  BulkAddTestQuestionsDto,
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
        sections: {
          orderBy: { order: 'asc' },
          include: { _count: { select: { testQuestions: true } } },
        },
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

  /**
   * `Test.bilingualRequired` (default true for new tests, backfilled false
   * on the pre-existing 106 legacy tests so their current composition stays
   * truthful) gates whether a question needs `servingEligibility ===
   * FULLY_ELIGIBLE` to be attached. This is the enforcement point for rule 5
   * ("newly curated bilingual-only question sets") and rule 6 ("new tests
   * explicitly configured as BILINGUAL_REQUIRED").
   */
  async addQuestion(testId: string, dto: AddTestQuestionDto) {
    const test = await this.prisma.test.findUniqueOrThrow({
      where: { id: testId },
    });

    if (test.bilingualRequired) {
      const question = await this.prisma.question.findUnique({
        where: { id: dto.questionId },
        select: { servingEligibility: true, status: true },
      });
      if (!question) throw new NotFoundException('Question not found');
      if (
        question.servingEligibility !==
        QuestionServingEligibility.FULLY_ELIGIBLE
      ) {
        throw new BadRequestException(
          `This test requires fully bilingual-validated questions. The selected question is not eligible (status: ${question.status}). Either publish the question first or mark this test as not bilingual-required.`,
        );
      }
    }

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

  /**
   * Same duplicate-prevention/bilingual-gate rules as `addQuestion`, but for
   * a test with no sections (the 106 pre-existing tests, or a simple new
   * test) — lets the Test Builder's paginated question selector attach many
   * questions in one bulk save instead of one API call per checkbox.
   */
  async addQuestionsBulk(testId: string, dto: BulkAddTestQuestionsDto) {
    const uniqueIds = [...new Set(dto.questionIds)];

    return this.prisma.$transaction(async (tx) => {
      const test = await tx.test.findUniqueOrThrow({ where: { id: testId } });

      const questions = await tx.question.findMany({
        where: { id: { in: uniqueIds }, deletedAt: null },
        select: { id: true, servingEligibility: true },
      });
      const foundIds = new Set(questions.map((q) => q.id));
      const missing = uniqueIds.filter((id) => !foundIds.has(id));
      if (missing.length > 0) {
        throw new BadRequestException(
          `Question(s) not found: ${missing.join(', ')}`,
        );
      }

      if (test.bilingualRequired) {
        const notEligible = questions.filter(
          (q) =>
            q.servingEligibility !== QuestionServingEligibility.FULLY_ELIGIBLE,
        );
        if (notEligible.length > 0) {
          throw new BadRequestException(
            `This test requires fully bilingual-validated questions. Not eligible: ${notEligible
              .map((q) => q.id)
              .join(', ')}`,
          );
        }
      }

      const existing = await tx.testQuestion.findMany({
        where: { testId, questionId: { in: uniqueIds } },
        select: { questionId: true },
      });
      const existingIds = new Set(existing.map((e) => e.questionId));
      const toAdd = uniqueIds.filter((id) => !existingIds.has(id));

      let nextOrder = await tx.testQuestion.count({ where: { testId } });
      if (toAdd.length > 0) {
        await tx.testQuestion.createMany({
          data: toAdd.map((questionId) => ({
            testId,
            questionId,
            order: nextOrder++,
          })),
        });
      }

      return {
        added: toAdd,
        alreadyInTest: uniqueIds
          .filter((id) => existingIds.has(id))
          .map((id) => ({
            questionId: id,
            message: `Question ${id} is already added to this test.`,
          })),
      };
    });
  }
}

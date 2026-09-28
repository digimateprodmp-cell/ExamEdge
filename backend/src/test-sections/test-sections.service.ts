import { BadRequestException, Injectable } from '@nestjs/common';
import { QuestionServingEligibility } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  AddSectionQuestionsDto,
  CreateTestSectionDto,
  UpdateTestSectionDto,
} from './dto/test-section.dto';

@Injectable()
export class TestSectionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForTest(testId: string) {
    return this.prisma.testSection.findMany({
      where: { testId },
      orderBy: { order: 'asc' },
      include: { _count: { select: { testQuestions: true } } },
    });
  }

  async create(testId: string, dto: CreateTestSectionDto) {
    await this.prisma.test.findUniqueOrThrow({ where: { id: testId } });
    const order =
      dto.order ?? (await this.prisma.testSection.count({ where: { testId } }));
    return this.prisma.testSection.create({
      data: { ...dto, testId, order },
    });
  }

  update(id: string, dto: UpdateTestSectionDto) {
    return this.prisma.testSection.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    // TestQuestion.sectionId is optional: removing a section just ungroups
    // its questions rather than deleting the (potentially graded) rows.
    return this.prisma.$transaction([
      this.prisma.testQuestion.updateMany({
        where: { sectionId: id },
        data: { sectionId: null },
      }),
      this.prisma.testSection.delete({ where: { id } }),
    ]);
  }

  /**
   * Paginated listing of the questions already attached to this section, for
   * the Test Builder's "what's in this section" view (spec §19/§46).
   */
  async questionsInSection(sectionId: string, page: number, limit: number) {
    const where = { sectionId };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.testQuestion.findMany({
        where,
        orderBy: { order: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          question: {
            include: {
              translations: true,
              options: { include: { translations: true } },
            },
          },
        },
      }),
      this.prisma.testQuestion.count({ where }),
    ]);
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  /**
   * Bulk-attach existing Question Bank questions to a section (spec §21-27,
   * §62-63). A question can be reused across many Tests, but never twice in
   * the same Test — enforced here (not just by the DB's `@@unique([testId,
   * questionId])`, so we can report exactly which ones were skipped) and
   * backstopped by that constraint for any race.
   */
  async addQuestions(sectionId: string, dto: AddSectionQuestionsDto) {
    const uniqueIds = [...new Set(dto.questionIds)];

    return this.prisma.$transaction(async (tx) => {
      const section = await tx.testSection.findUniqueOrThrow({
        where: { id: sectionId },
        include: { test: true },
      });

      const questions = await tx.question.findMany({
        where: { id: { in: uniqueIds }, deletedAt: null },
        select: { id: true, servingEligibility: true, status: true },
      });
      const foundIds = new Set(questions.map((q) => q.id));
      const missing = uniqueIds.filter((id) => !foundIds.has(id));
      if (missing.length > 0) {
        throw new BadRequestException(
          `Question(s) not found: ${missing.join(', ')}`,
        );
      }

      if (section.test.bilingualRequired) {
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
        where: { testId: section.testId, questionId: { in: uniqueIds } },
        select: { questionId: true },
      });
      const existingIds = new Set(existing.map((e) => e.questionId));
      const toAdd = uniqueIds.filter((id) => !existingIds.has(id));

      let nextOrder = await tx.testQuestion.count({
        where: { testId: section.testId },
      });

      if (toAdd.length > 0) {
        await tx.testQuestion.createMany({
          data: toAdd.map((questionId) => ({
            testId: section.testId,
            sectionId,
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

  removeQuestion(sectionId: string, questionId: string) {
    return this.prisma.testQuestion.deleteMany({
      where: { sectionId, questionId },
    });
  }
}

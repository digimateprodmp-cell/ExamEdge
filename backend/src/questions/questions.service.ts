import { BadRequestException, Injectable } from '@nestjs/common';
import { Language, Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  PaginationDto,
  buildPaginationMeta,
} from '../common/dto/pagination.dto';
import { CreateQuestionDto, UpdateQuestionDto } from './dto/question.dto';

interface QuestionListFilters extends PaginationDto {
  subjectId?: string;
  topicId?: string;
}

const FULL_INCLUDE = {
  translations: true,
  options: {
    include: { translations: true },
    orderBy: { order: 'asc' as const },
  },
  subject: true,
  topic: true,
};

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: QuestionListFilters) {
    const { page, limit, search, subjectId, topicId } = filters;
    const where = {
      deletedAt: null,
      ...(subjectId ? { subjectId } : {}),
      ...(topicId ? { topicId } : {}),
      ...(search
        ? { translations: { some: { text: { contains: search } } } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.question.findMany({
        where,
        include: FULL_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.question.count({ where }),
    ]);

    return { items, ...buildPaginationMeta(total, page, limit) };
  }

  findOne(id: string) {
    return this.prisma.question.findFirstOrThrow({
      where: { id, deletedAt: null },
      include: FULL_INCLUDE,
    });
  }

  private validate(
    dto: CreateQuestionDto | UpdateQuestionDto,
    requireOptions: boolean,
  ) {
    if ('textEn' in dto && !dto.textEn && !dto.textHi && requireOptions) {
      throw new BadRequestException(
        'Provide the question text in at least one language',
      );
    }
    if (dto.options) {
      if (dto.options.length < 2) {
        throw new BadRequestException('A question needs at least two options');
      }
      if (!dto.options.some((o) => o.isCorrect)) {
        throw new BadRequestException('Mark at least one option as correct');
      }
      for (const option of dto.options) {
        if (!option.textEn && !option.textHi) {
          throw new BadRequestException(
            'Provide each option text in at least one language',
          );
        }
      }
    }
  }

  async create(dto: CreateQuestionDto, createdById: string) {
    this.validate(dto, true);

    return this.prisma.$transaction(async (tx) => {
      const question = await tx.question.create({
        data: {
          subjectId: dto.subjectId,
          topicId: dto.topicId,
          type: dto.type,
          difficulty: dto.difficulty,
          marks: dto.marks,
          negativeMarks: dto.negativeMarks,
          createdById,
        },
      });

      await this.writeTranslations(tx, question.id, dto);
      await this.writeOptions(tx, question.id, dto.options);

      return tx.question.findUniqueOrThrow({
        where: { id: question.id },
        include: FULL_INCLUDE,
      });
    });
  }

  async update(id: string, dto: UpdateQuestionDto) {
    this.validate(dto, false);

    return this.prisma.$transaction(async (tx) => {
      await tx.question.update({
        where: { id },
        data: {
          subjectId: dto.subjectId,
          topicId: dto.topicId,
          type: dto.type,
          difficulty: dto.difficulty,
          marks: dto.marks,
          negativeMarks: dto.negativeMarks,
        },
      });

      await this.writeTranslations(tx, id, dto);
      if (dto.options) {
        await tx.questionOption.deleteMany({ where: { questionId: id } });
        await this.writeOptions(tx, id, dto.options);
      }

      return tx.question.findUniqueOrThrow({
        where: { id },
        include: FULL_INCLUDE,
      });
    });
  }

  remove(id: string) {
    return this.prisma.question.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async writeTranslations(
    tx: Prisma.TransactionClient,
    questionId: string,
    dto: {
      textEn?: string;
      textHi?: string;
      explanationEn?: string;
      explanationHi?: string;
    },
  ) {
    if (dto.textEn !== undefined) {
      await tx.questionTranslation.upsert({
        where: { questionId_language: { questionId, language: Language.EN } },
        create: {
          questionId,
          language: Language.EN,
          text: dto.textEn,
          explanation: dto.explanationEn,
        },
        update: { text: dto.textEn, explanation: dto.explanationEn },
      });
    }
    if (dto.textHi !== undefined) {
      await tx.questionTranslation.upsert({
        where: { questionId_language: { questionId, language: Language.HI } },
        create: {
          questionId,
          language: Language.HI,
          text: dto.textHi,
          explanation: dto.explanationHi,
        },
        update: { text: dto.textHi, explanation: dto.explanationHi },
      });
    }
  }

  private async writeOptions(
    tx: Prisma.TransactionClient,
    questionId: string,
    options: CreateQuestionDto['options'],
  ) {
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      const created = await tx.questionOption.create({
        data: {
          questionId,
          order: option.order ?? i,
          isCorrect: !!option.isCorrect,
        },
      });

      if (option.textEn) {
        await tx.optionTranslation.create({
          data: {
            optionId: created.id,
            language: Language.EN,
            text: option.textEn,
          },
        });
      }
      if (option.textHi) {
        await tx.optionTranslation.create({
          data: {
            optionId: created.id,
            language: Language.HI,
            text: option.textHi,
          },
        });
      }
    }
  }
}

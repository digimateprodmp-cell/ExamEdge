import { Injectable } from '@nestjs/common';
import { Language, Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  PaginationDto,
  buildPaginationMeta,
} from '../common/dto/pagination.dto';
import {
  CreateCurrentAffairCategoryDto,
  CreateCurrentAffairDto,
  UpdateCurrentAffairDto,
} from './dto/current-affair.dto';

const WITH_TRANSLATIONS = { translations: true, category: true };

function resolve(
  item: Prisma.CurrentAffairGetPayload<{ include: typeof WITH_TRANSLATIONS }>,
  lang: Language,
) {
  const translation =
    item.translations.find((t) => t.language === lang) ?? item.translations[0];
  return {
    id: item.id,
    date: item.date,
    category: item.category,
    isPublished: item.isPublished,
    title: translation?.title ?? '',
    content: translation?.content ?? '',
  };
}

@Injectable()
export class CurrentAffairsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllPublic(
    pagination: PaginationDto,
    lang: Language,
    categoryId?: string,
  ) {
    const { page, limit } = pagination;
    const where: Prisma.CurrentAffairWhereInput = {
      isPublished: true,
      ...(categoryId ? { categoryId } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.currentAffair.findMany({
        where,
        include: WITH_TRANSLATIONS,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.currentAffair.count({ where }),
    ]);

    return {
      items: items.map((i) => resolve(i, lang)),
      ...buildPaginationMeta(total, page, limit),
    };
  }

  async findOnePublic(id: string, lang: Language) {
    const item = await this.prisma.currentAffair.findFirstOrThrow({
      where: { id, isPublished: true },
      include: WITH_TRANSLATIONS,
    });
    return resolve(item, lang);
  }

  findAllAdmin(pagination: PaginationDto) {
    const { page, limit } = pagination;
    return this.prisma
      .$transaction([
        this.prisma.currentAffair.findMany({
          include: WITH_TRANSLATIONS,
          orderBy: { date: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.currentAffair.count(),
      ])
      .then(([items, total]) => ({
        items,
        ...buildPaginationMeta(total, page, limit),
      }));
  }

  async create(dto: CreateCurrentAffairDto) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.currentAffair.create({
        data: {
          date: new Date(dto.date),
          categoryId: dto.categoryId,
          isPublished: dto.isPublished ?? false,
        },
      });
      await this.writeTranslations(tx, item.id, dto);
      return tx.currentAffair.findUniqueOrThrow({
        where: { id: item.id },
        include: WITH_TRANSLATIONS,
      });
    });
  }

  async update(id: string, dto: UpdateCurrentAffairDto) {
    return this.prisma.$transaction(async (tx) => {
      await tx.currentAffair.update({
        where: { id },
        data: {
          date: dto.date ? new Date(dto.date) : undefined,
          categoryId: dto.categoryId,
          isPublished: dto.isPublished,
        },
      });
      await this.writeTranslations(tx, id, dto);
      return tx.currentAffair.findUniqueOrThrow({
        where: { id },
        include: WITH_TRANSLATIONS,
      });
    });
  }

  remove(id: string) {
    return this.prisma.currentAffair.delete({ where: { id } });
  }

  private async writeTranslations(
    tx: Prisma.TransactionClient,
    currentAffairId: string,
    dto: {
      titleEn?: string;
      titleHi?: string;
      contentEn?: string;
      contentHi?: string;
    },
  ) {
    if (dto.titleEn !== undefined || dto.contentEn !== undefined) {
      await tx.currentAffairTranslation.upsert({
        where: {
          currentAffairId_language: { currentAffairId, language: Language.EN },
        },
        create: {
          currentAffairId,
          language: Language.EN,
          title: dto.titleEn ?? '',
          content: dto.contentEn ?? '',
        },
        update: {
          ...(dto.titleEn !== undefined ? { title: dto.titleEn } : {}),
          ...(dto.contentEn !== undefined ? { content: dto.contentEn } : {}),
        },
      });
    }
    if (dto.titleHi !== undefined || dto.contentHi !== undefined) {
      await tx.currentAffairTranslation.upsert({
        where: {
          currentAffairId_language: { currentAffairId, language: Language.HI },
        },
        create: {
          currentAffairId,
          language: Language.HI,
          title: dto.titleHi ?? '',
          content: dto.contentHi ?? '',
        },
        update: {
          ...(dto.titleHi !== undefined ? { title: dto.titleHi } : {}),
          ...(dto.contentHi !== undefined ? { content: dto.contentHi } : {}),
        },
      });
    }
  }
}

@Injectable()
export class CurrentAffairCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.currentAffairCategory.findMany({
      orderBy: { nameEn: 'asc' },
    });
  }

  create(dto: CreateCurrentAffairCategoryDto) {
    return this.prisma.currentAffairCategory.create({ data: dto });
  }

  remove(id: string) {
    return this.prisma.currentAffairCategory.delete({ where: { id } });
  }
}

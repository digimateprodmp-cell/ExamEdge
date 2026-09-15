import { Injectable } from '@nestjs/common';
import { Language, Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  PaginationDto,
  buildPaginationMeta,
} from '../common/dto/pagination.dto';
import { CreateBlogCategoryDto } from './dto/blog.dto';
import { CreateBlogDto, UpdateBlogDto } from './dto/blog.dto';

const WITH_TRANSLATIONS = { translations: true, category: true };

function resolve(
  blog: Prisma.BlogGetPayload<{ include: typeof WITH_TRANSLATIONS }>,
  lang: Language,
) {
  const translation =
    blog.translations.find((t) => t.language === lang) ?? blog.translations[0];
  return {
    id: blog.id,
    slug: blog.slug,
    coverImageUrl: blog.coverImageUrl,
    category: blog.category,
    isPublished: blog.isPublished,
    publishedAt: blog.publishedAt,
    title: translation?.title ?? '',
    excerpt: translation?.excerpt ?? null,
    content: translation?.content ?? '',
  };
}

@Injectable()
export class BlogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllPublic(
    pagination: PaginationDto,
    lang: Language,
    categoryId?: string,
  ) {
    const { page, limit, search } = pagination;
    const where: Prisma.BlogWhereInput = {
      deletedAt: null,
      isPublished: true,
      ...(categoryId ? { categoryId } : {}),
      ...(search
        ? { translations: { some: { title: { contains: search } } } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.blog.findMany({
        where,
        include: WITH_TRANSLATIONS,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.blog.count({ where }),
    ]);

    return {
      items: items.map((b) => resolve(b, lang)),
      ...buildPaginationMeta(total, page, limit),
    };
  }

  async findOnePublicBySlug(slug: string, lang: Language) {
    const blog = await this.prisma.blog.findFirstOrThrow({
      where: { slug, deletedAt: null, isPublished: true },
      include: WITH_TRANSLATIONS,
    });
    return resolve(blog, lang);
  }

  findAllAdmin(pagination: PaginationDto) {
    const { page, limit } = pagination;
    return this.prisma
      .$transaction([
        this.prisma.blog.findMany({
          where: { deletedAt: null },
          include: WITH_TRANSLATIONS,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.blog.count({ where: { deletedAt: null } }),
      ])
      .then(([items, total]) => ({
        items,
        ...buildPaginationMeta(total, page, limit),
      }));
  }

  findOneAdmin(id: string) {
    return this.prisma.blog.findFirstOrThrow({
      where: { id, deletedAt: null },
      include: WITH_TRANSLATIONS,
    });
  }

  async create(dto: CreateBlogDto, authorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const blog = await tx.blog.create({
        data: {
          slug: dto.slug,
          coverImageUrl: dto.coverImageUrl,
          categoryId: dto.categoryId,
          isPublished: dto.isPublished ?? false,
          publishedAt: dto.isPublished ? new Date() : null,
          authorId,
        },
      });
      await this.writeTranslations(tx, blog.id, dto);
      return tx.blog.findUniqueOrThrow({
        where: { id: blog.id },
        include: WITH_TRANSLATIONS,
      });
    });
  }

  async update(id: string, dto: UpdateBlogDto) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.blog.findUniqueOrThrow({ where: { id } });
      await tx.blog.update({
        where: { id },
        data: {
          slug: dto.slug,
          coverImageUrl: dto.coverImageUrl,
          categoryId: dto.categoryId,
          isPublished: dto.isPublished,
          publishedAt:
            dto.isPublished && !existing.publishedAt
              ? new Date()
              : existing.publishedAt,
        },
      });
      await this.writeTranslations(tx, id, dto);
      return tx.blog.findUniqueOrThrow({
        where: { id },
        include: WITH_TRANSLATIONS,
      });
    });
  }

  remove(id: string) {
    return this.prisma.blog.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async writeTranslations(
    tx: Prisma.TransactionClient,
    blogId: string,
    dto: {
      titleEn?: string;
      titleHi?: string;
      excerptEn?: string;
      excerptHi?: string;
      contentEn?: string;
      contentHi?: string;
    },
  ) {
    if (dto.titleEn !== undefined || dto.contentEn !== undefined) {
      await tx.blogTranslation.upsert({
        where: { blogId_language: { blogId, language: Language.EN } },
        create: {
          blogId,
          language: Language.EN,
          title: dto.titleEn ?? '',
          excerpt: dto.excerptEn,
          content: dto.contentEn ?? '',
        },
        update: {
          ...(dto.titleEn !== undefined ? { title: dto.titleEn } : {}),
          ...(dto.excerptEn !== undefined ? { excerpt: dto.excerptEn } : {}),
          ...(dto.contentEn !== undefined ? { content: dto.contentEn } : {}),
        },
      });
    }
    if (dto.titleHi !== undefined || dto.contentHi !== undefined) {
      await tx.blogTranslation.upsert({
        where: { blogId_language: { blogId, language: Language.HI } },
        create: {
          blogId,
          language: Language.HI,
          title: dto.titleHi ?? '',
          excerpt: dto.excerptHi,
          content: dto.contentHi ?? '',
        },
        update: {
          ...(dto.titleHi !== undefined ? { title: dto.titleHi } : {}),
          ...(dto.excerptHi !== undefined ? { excerpt: dto.excerptHi } : {}),
          ...(dto.contentHi !== undefined ? { content: dto.contentHi } : {}),
        },
      });
    }
  }
}

@Injectable()
export class BlogCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.blogCategory.findMany({ orderBy: { nameEn: 'asc' } });
  }

  create(dto: CreateBlogCategoryDto) {
    return this.prisma.blogCategory.create({ data: dto });
  }

  remove(id: string) {
    return this.prisma.blogCategory.delete({ where: { id } });
  }
}

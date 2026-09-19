import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  AddExamProfileDto,
  UpdateExamProfileDto,
} from './dto/student-exam-profile.dto';

@Injectable()
export class StudentProfileService {
  constructor(private readonly prisma: PrismaService) {}

  listMine(userId: string) {
    return this.prisma.studentExamProfile.findMany({
      where: { userId, isActive: true },
      include: {
        examCycle: { include: { exam: true } },
      },
      orderBy: [{ isPrimary: 'desc' }, { lastActivityAt: 'desc' }],
    });
  }

  async add(userId: string, dto: AddExamProfileDto) {
    const cycle = await this.prisma.examCycle.findFirst({
      where: { id: dto.examCycleId, isActive: true },
    });
    if (!cycle) throw new NotFoundException('Exam cycle not found');

    const existing = await this.prisma.studentExamProfile.findUnique({
      where: { userId_examCycleId: { userId, examCycleId: dto.examCycleId } },
    });
    if (existing) {
      if (existing.isActive) {
        throw new BadRequestException('Already preparing for this exam cycle');
      }
      return this.prisma.studentExamProfile.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          targetYear: dto.targetYear,
          preferredLanguage: dto.preferredLanguage,
          preferredDifficulty: dto.preferredDifficulty,
          targetExamDate: dto.targetExamDate
            ? new Date(dto.targetExamDate)
            : undefined,
          lastActivityAt: new Date(),
        },
      });
    }

    const hasAny = await this.prisma.studentExamProfile.findFirst({
      where: { userId, isActive: true },
    });

    return this.prisma.studentExamProfile.create({
      data: {
        userId,
        examCycleId: dto.examCycleId,
        targetYear: dto.targetYear,
        preferredLanguage: dto.preferredLanguage,
        preferredDifficulty: dto.preferredDifficulty,
        targetExamDate: dto.targetExamDate
          ? new Date(dto.targetExamDate)
          : undefined,
        isPrimary: !hasAny,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateExamProfileDto) {
    const profile = await this.loadOwned(userId, id);
    return this.prisma.studentExamProfile.update({
      where: { id: profile.id },
      data: {
        targetYear: dto.targetYear,
        preferredLanguage: dto.preferredLanguage,
        preferredDifficulty: dto.preferredDifficulty,
        prepStatus: dto.prepStatus,
        targetExamDate: dto.targetExamDate
          ? new Date(dto.targetExamDate)
          : undefined,
        lastActivityAt: new Date(),
      },
    });
  }

  async setPrimary(userId: string, id: string) {
    const profile = await this.loadOwned(userId, id);
    await this.prisma.$transaction([
      this.prisma.studentExamProfile.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false },
      }),
      this.prisma.studentExamProfile.update({
        where: { id: profile.id },
        data: { isPrimary: true, lastActivityAt: new Date() },
      }),
    ]);
    return this.prisma.studentExamProfile.findUniqueOrThrow({
      where: { id: profile.id },
    });
  }

  async remove(userId: string, id: string) {
    const profile = await this.loadOwned(userId, id);
    const updated = await this.prisma.studentExamProfile.update({
      where: { id: profile.id },
      data: { isActive: false, isPrimary: false },
    });

    if (profile.isPrimary) {
      const nextPrimary = await this.prisma.studentExamProfile.findFirst({
        where: { userId, isActive: true },
        orderBy: { lastActivityAt: 'desc' },
      });
      if (nextPrimary) {
        await this.prisma.studentExamProfile.update({
          where: { id: nextPrimary.id },
          data: { isPrimary: true },
        });
      }
    }

    return updated;
  }

  private async loadOwned(userId: string, id: string) {
    const profile = await this.prisma.studentExamProfile.findUnique({
      where: { id },
    });
    if (!profile || profile.userId !== userId || !profile.isActive) {
      throw new NotFoundException('Exam profile not found');
    }
    return profile;
  }
}

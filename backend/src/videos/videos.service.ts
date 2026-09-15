import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateVideoDto, UpdateVideoDto } from './dto/video.dto';

const LIST_SELECT = {
  id: true,
  courseId: true,
  batchId: true,
  titleEn: true,
  titleHi: true,
  isFree: true,
  durationSeconds: true,
  createdAt: true,
};

@Injectable()
export class VideosService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(courseId?: string, batchId?: string) {
    return this.prisma.video.findMany({
      where: {
        ...(courseId ? { courseId } : {}),
        ...(batchId ? { batchId } : {}),
      },
      select: LIST_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  create(dto: CreateVideoDto) {
    return this.prisma.video.create({ data: dto });
  }

  update(id: string, dto: UpdateVideoDto) {
    return this.prisma.video.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.video.delete({ where: { id } });
  }

  async getStreamUrl(userId: string, videoId: string) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });
    if (!video) throw new NotFoundException('Video not found');
    if (video.isFree) return { videoUrl: video.videoUrl };

    const enrolled = await this.prisma.enrollment.findFirst({
      where: {
        userId,
        OR: [
          ...(video.courseId ? [{ courseId: video.courseId }] : []),
          ...(video.batchId ? [{ batchId: video.batchId }] : []),
        ],
        AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }],
      },
    });
    if (!enrolled) {
      throw new ForbiddenException(
        'Enroll in this course or batch to watch this video',
      );
    }
    return { videoUrl: video.videoUrl };
  }
}

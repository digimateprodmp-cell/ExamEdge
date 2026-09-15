import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreateNoteVolumeDto,
  UpdateNoteVolumeDto,
} from './dto/note-volume.dto';
import { CreateNoteDto, UpdateNoteDto } from './dto/note.dto';

@Injectable()
export class NoteVolumesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(courseId?: string) {
    return this.prisma.noteVolume.findMany({
      where: courseId ? { courseId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const volume = await this.prisma.noteVolume.findUniqueOrThrow({
      where: { id },
      include: { notes: { orderBy: { createdAt: 'asc' } } },
    });
    return {
      ...volume,
      notes: volume.notes.map((note) => ({
        ...note,
        fileUrl: note.isFree ? note.fileUrl : null,
      })),
    };
  }

  create(dto: CreateNoteVolumeDto) {
    return this.prisma.noteVolume.create({ data: dto });
  }

  update(id: string, dto: UpdateNoteVolumeDto) {
    return this.prisma.noteVolume.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.noteVolume.delete({ where: { id } });
  }
}

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateNoteDto) {
    return this.prisma.note.create({ data: dto });
  }

  update(id: string, dto: UpdateNoteDto) {
    return this.prisma.note.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.note.delete({ where: { id } });
  }

  async getDownloadUrl(userId: string, noteId: string) {
    const note = await this.prisma.note.findUnique({ where: { id: noteId } });
    if (!note) throw new NotFoundException('Note not found');
    if (note.isFree) return { fileUrl: note.fileUrl };

    const enrolled = await this.prisma.enrollment.findFirst({
      where: {
        userId,
        noteVolumeId: note.noteVolumeId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
    if (!enrolled) {
      throw new ForbiddenException(
        'Purchase this note volume to download this file',
      );
    }
    return { fileUrl: note.fileUrl };
  }
}

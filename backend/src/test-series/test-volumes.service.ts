import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreateTestVolumeDto,
  UpdateTestVolumeDto,
} from './dto/test-volume.dto';

@Injectable()
export class TestVolumesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(testSeriesId?: string) {
    return this.prisma.testVolume.findMany({
      where: testSeriesId ? { testSeriesId } : undefined,
      orderBy: { order: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.testVolume.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateTestVolumeDto) {
    return this.prisma.testVolume.create({ data: dto });
  }

  update(id: string, dto: UpdateTestVolumeDto) {
    return this.prisma.testVolume.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.testVolume.delete({ where: { id } });
  }
}

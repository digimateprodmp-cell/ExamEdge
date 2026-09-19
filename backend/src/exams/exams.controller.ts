import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ExamsService } from './exams.service';
import {
  CreateExamCycleDto,
  CreateExamDto,
  CreateSyllabusTopicDto,
  CreateSyllabusVersionDto,
  UpdateExamCycleDto,
  UpdateExamDto,
} from './dto/exam.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Public()
  @Get()
  findAllPublic() {
    return this.examsService.findAllPublic();
  }

  @Public()
  @Get(':id/cycles')
  findCyclesPublic(@Param('id') id: string) {
    return this.examsService.findCyclesPublic(id);
  }

  @Roles(Role.ADMIN)
  @Get('admin')
  findAllAdmin() {
    return this.examsService.findAllAdmin();
  }

  @Roles(Role.ADMIN)
  @Get('admin/:id')
  findOneAdmin(@Param('id') id: string) {
    return this.examsService.findOneAdmin(id);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateExamDto) {
    return this.examsService.create(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateExamDto) {
    return this.examsService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.examsService.remove(id);
  }

  @Roles(Role.ADMIN)
  @Post(':id/cycles')
  createCycle(@Param('id') examId: string, @Body() dto: CreateExamCycleDto) {
    return this.examsService.createCycle(examId, dto);
  }

  @Roles(Role.ADMIN)
  @Patch('cycles/:cycleId')
  updateCycle(
    @Param('cycleId') cycleId: string,
    @Body() dto: UpdateExamCycleDto,
  ) {
    return this.examsService.updateCycle(cycleId, dto);
  }

  @Roles(Role.ADMIN)
  @Delete('cycles/:cycleId')
  removeCycle(@Param('cycleId') cycleId: string) {
    return this.examsService.removeCycle(cycleId);
  }

  @Roles(Role.ADMIN)
  @Post('cycles/:cycleId/syllabus-versions')
  createSyllabusVersion(
    @Param('cycleId') cycleId: string,
    @Body() dto: CreateSyllabusVersionDto,
  ) {
    return this.examsService.createSyllabusVersion(cycleId, dto);
  }

  @Roles(Role.ADMIN)
  @Post('syllabus-versions/:versionId/topics')
  addSyllabusTopic(
    @Param('versionId') versionId: string,
    @Body() dto: CreateSyllabusTopicDto,
  ) {
    return this.examsService.addSyllabusTopic(versionId, dto);
  }

  @Roles(Role.ADMIN)
  @Delete('syllabus-versions/:versionId/topics/:topicId')
  removeSyllabusTopic(
    @Param('versionId') versionId: string,
    @Param('topicId') topicId: string,
  ) {
    return this.examsService.removeSyllabusTopic(versionId, topicId);
  }
}

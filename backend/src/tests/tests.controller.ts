import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { TestsService } from './tests.service';
import {
  AddTestQuestionDto,
  CreateTestDto,
  UpdateTestDto,
} from './dto/test.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('tests')
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Public()
  @Get()
  findAllPublic(@Query('testVolumeId') testVolumeId?: string) {
    return this.testsService.findAllPublic(testVolumeId);
  }

  @Roles(Role.ADMIN)
  @Get('admin')
  findAllAdmin(@Query('testVolumeId') testVolumeId?: string) {
    return this.testsService.findAllAdmin(testVolumeId);
  }

  @Roles(Role.ADMIN)
  @Get('admin/:id')
  findOneAdmin(@Param('id') id: string) {
    return this.testsService.findOneAdmin(id);
  }

  @Public()
  @Get(':id')
  findOnePublic(@Param('id') id: string) {
    return this.testsService.findOnePublic(id);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateTestDto) {
    return this.testsService.create(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTestDto) {
    return this.testsService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.testsService.remove(id);
  }

  @Roles(Role.ADMIN)
  @Post(':id/questions')
  addQuestion(@Param('id') id: string, @Body() dto: AddTestQuestionDto) {
    return this.testsService.addQuestion(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id/questions/:questionId')
  removeQuestion(
    @Param('id') id: string,
    @Param('questionId') questionId: string,
  ) {
    return this.testsService.removeQuestion(id, questionId);
  }
}

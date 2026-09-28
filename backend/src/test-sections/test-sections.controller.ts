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
import { TestSectionsService } from './test-sections.service';
import {
  AddSectionQuestionsDto,
  CreateTestSectionDto,
  UpdateTestSectionDto,
} from './dto/test-section.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@Roles(Role.ADMIN)
@Controller('tests/:testId/sections')
export class TestSectionsController {
  constructor(private readonly testSectionsService: TestSectionsService) {}

  @Get()
  findAll(@Param('testId') testId: string) {
    return this.testSectionsService.findAllForTest(testId);
  }

  @Post()
  create(@Param('testId') testId: string, @Body() dto: CreateTestSectionDto) {
    return this.testSectionsService.create(testId, dto);
  }
}

@Roles(Role.ADMIN)
@Controller('test-sections')
export class TestSectionQuestionsController {
  constructor(private readonly testSectionsService: TestSectionsService) {}

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTestSectionDto) {
    return this.testSectionsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.testSectionsService.remove(id);
  }

  @Get(':id/questions')
  questionsInSection(
    @Param('id') id: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.testSectionsService.questionsInSection(
      id,
      pagination.page,
      pagination.limit,
    );
  }

  @Post(':id/questions')
  addQuestions(@Param('id') id: string, @Body() dto: AddSectionQuestionsDto) {
    return this.testSectionsService.addQuestions(id, dto);
  }

  @Delete(':id/questions/:questionId')
  removeQuestion(
    @Param('id') id: string,
    @Param('questionId') questionId: string,
  ) {
    return this.testSectionsService.removeQuestion(id, questionId);
  }
}

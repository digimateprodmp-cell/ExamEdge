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
import { QuestionTagsService } from './question-tags.service';
import {
  CreateQuestionTagDto,
  UpdateQuestionTagDto,
} from './dto/question-tag.dto';
import { Roles } from '../common/decorators/roles.decorator';

@Roles(Role.ADMIN)
@Controller('question-tags')
export class QuestionTagsController {
  constructor(private readonly questionTagsService: QuestionTagsService) {}

  @Get()
  findAll() {
    return this.questionTagsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.questionTagsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateQuestionTagDto) {
    return this.questionTagsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateQuestionTagDto) {
    return this.questionTagsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.questionTagsService.remove(id);
  }
}

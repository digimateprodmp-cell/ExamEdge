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
import { TopicsService } from './topics.service';
import { CreateTopicDto, UpdateTopicDto } from './dto/topic.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Public()
  @Get()
  findAll(@Query('subjectId') subjectId?: string) {
    return this.topicsService.findAll(subjectId);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateTopicDto) {
    return this.topicsService.create(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTopicDto) {
    return this.topicsService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.topicsService.remove(id);
  }
}

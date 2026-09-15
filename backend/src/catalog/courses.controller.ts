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
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Public()
  @Get()
  findAllPublic(@Query() pagination: PaginationDto) {
    return this.coursesService.findAllPublic(pagination);
  }

  @Roles(Role.ADMIN)
  @Get('admin')
  findAllAdmin(@Query() pagination: PaginationDto) {
    return this.coursesService.findAllAdmin(pagination);
  }

  @Roles(Role.ADMIN)
  @Get('admin/:id')
  findOneAdmin(@Param('id') id: string) {
    return this.coursesService.findOneAdmin(id);
  }

  @Public()
  @Get(':id')
  findOnePublic(@Param('id') id: string) {
    return this.coursesService.findOnePublic(id);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateCourseDto) {
    return this.coursesService.create(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.coursesService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }
}

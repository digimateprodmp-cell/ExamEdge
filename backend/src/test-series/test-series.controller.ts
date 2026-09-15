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
import { TestSeriesService } from './test-series.service';
import {
  CreateTestSeriesDto,
  UpdateTestSeriesDto,
} from './dto/test-series.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('test-series')
export class TestSeriesController {
  constructor(private readonly testSeriesService: TestSeriesService) {}

  @Public()
  @Get()
  findAllPublic(@Query() pagination: PaginationDto) {
    return this.testSeriesService.findAllPublic(pagination);
  }

  @Roles(Role.ADMIN)
  @Get('admin')
  findAllAdmin(@Query() pagination: PaginationDto) {
    return this.testSeriesService.findAllAdmin(pagination);
  }

  @Roles(Role.ADMIN)
  @Get('admin/:id')
  findOneAdmin(@Param('id') id: string) {
    return this.testSeriesService.findOneAdmin(id);
  }

  @Public()
  @Get(':id')
  findOnePublic(@Param('id') id: string) {
    return this.testSeriesService.findOnePublic(id);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateTestSeriesDto) {
    return this.testSeriesService.create(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTestSeriesDto) {
    return this.testSeriesService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.testSeriesService.remove(id);
  }
}

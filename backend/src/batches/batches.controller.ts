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
import { BatchesService } from './batches.service';
import { CreateBatchDto, UpdateBatchDto } from './dto/batch.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('batches')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Public()
  @Get()
  findAllPublic(@Query() pagination: PaginationDto) {
    return this.batchesService.findAllPublic(pagination);
  }

  @Roles(Role.ADMIN)
  @Get('admin')
  findAllAdmin(@Query() pagination: PaginationDto) {
    return this.batchesService.findAllAdmin(pagination);
  }

  @Roles(Role.ADMIN)
  @Get('admin/:id')
  findOneAdmin(@Param('id') id: string) {
    return this.batchesService.findOneAdmin(id);
  }

  @Public()
  @Get(':id')
  findOnePublic(@Param('id') id: string) {
    return this.batchesService.findOnePublic(id);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateBatchDto) {
    return this.batchesService.create(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBatchDto) {
    return this.batchesService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.batchesService.remove(id);
  }
}

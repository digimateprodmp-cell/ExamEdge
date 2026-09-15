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
import { TestVolumesService } from './test-volumes.service';
import {
  CreateTestVolumeDto,
  UpdateTestVolumeDto,
} from './dto/test-volume.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('test-volumes')
export class TestVolumesController {
  constructor(private readonly testVolumesService: TestVolumesService) {}

  @Public()
  @Get()
  findAll(@Query('testSeriesId') testSeriesId?: string) {
    return this.testVolumesService.findAll(testSeriesId);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.testVolumesService.findOne(id);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateTestVolumeDto) {
    return this.testVolumesService.create(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTestVolumeDto) {
    return this.testVolumesService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.testVolumesService.remove(id);
  }
}

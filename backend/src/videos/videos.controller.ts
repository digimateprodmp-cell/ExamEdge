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
import { VideosService } from './videos.service';
import { CreateVideoDto, UpdateVideoDto } from './dto/video.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Public()
  @Get()
  findAll(
    @Query('courseId') courseId?: string,
    @Query('batchId') batchId?: string,
  ) {
    return this.videosService.findAll(courseId, batchId);
  }

  @Get(':id/stream-url')
  getStreamUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.videosService.getStreamUrl(user.id, id);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateVideoDto) {
    return this.videosService.create(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVideoDto) {
    return this.videosService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.videosService.remove(id);
  }
}

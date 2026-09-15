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
import { NoteVolumesService, NotesService } from './notes.service';
import {
  CreateNoteVolumeDto,
  UpdateNoteVolumeDto,
} from './dto/note-volume.dto';
import { CreateNoteDto, UpdateNoteDto } from './dto/note.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@Controller('note-volumes')
export class NoteVolumesController {
  constructor(private readonly noteVolumesService: NoteVolumesService) {}

  @Public()
  @Get()
  findAll(@Query('courseId') courseId?: string) {
    return this.noteVolumesService.findAll(courseId);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.noteVolumesService.findOne(id);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateNoteVolumeDto) {
    return this.noteVolumesService.create(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateNoteVolumeDto) {
    return this.noteVolumesService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.noteVolumesService.remove(id);
  }
}

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get(':id/download')
  getDownloadUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.notesService.getDownloadUrl(user.id, id);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateNoteDto) {
    return this.notesService.create(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateNoteDto) {
    return this.notesService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notesService.remove(id);
  }
}

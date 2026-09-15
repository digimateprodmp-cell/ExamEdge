import { Module } from '@nestjs/common';
import { NoteVolumesController, NotesController } from './notes.controller';
import { NoteVolumesService, NotesService } from './notes.service';

@Module({
  controllers: [NoteVolumesController, NotesController],
  providers: [NoteVolumesService, NotesService],
  exports: [NoteVolumesService, NotesService],
})
export class NotesModule {}

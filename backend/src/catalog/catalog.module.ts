import { Module } from '@nestjs/common';
import { SubjectsController } from './subjects.controller';
import { SubjectsService } from './subjects.service';
import { TopicsController } from './topics.controller';
import { TopicsService } from './topics.service';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';

@Module({
  controllers: [SubjectsController, TopicsController, CoursesController],
  providers: [SubjectsService, TopicsService, CoursesService],
  exports: [SubjectsService, TopicsService, CoursesService],
})
export class CatalogModule {}

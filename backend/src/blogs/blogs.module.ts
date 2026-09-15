import { Module } from '@nestjs/common';
import { BlogCategoriesController, BlogsController } from './blogs.controller';
import { BlogCategoriesService, BlogsService } from './blogs.service';

@Module({
  controllers: [BlogsController, BlogCategoriesController],
  providers: [BlogsService, BlogCategoriesService],
  exports: [BlogsService, BlogCategoriesService],
})
export class BlogsModule {}

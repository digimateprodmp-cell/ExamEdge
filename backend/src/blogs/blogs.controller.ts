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
import { BlogCategoriesService, BlogsService } from './blogs.service';
import {
  CreateBlogCategoryDto,
  CreateBlogDto,
  UpdateBlogDto,
} from './dto/blog.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Lang } from '../common/decorators/lang.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Language } from '@prisma/client';

@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Public()
  @Get()
  findAllPublic(
    @Query() pagination: PaginationDto,
    @Lang() lang: Language,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.blogsService.findAllPublic(pagination, lang, categoryId);
  }

  @Roles(Role.ADMIN)
  @Get('admin')
  findAllAdmin(@Query() pagination: PaginationDto) {
    return this.blogsService.findAllAdmin(pagination);
  }

  @Roles(Role.ADMIN)
  @Get('admin/:id')
  findOneAdmin(@Param('id') id: string) {
    return this.blogsService.findOneAdmin(id);
  }

  @Public()
  @Get(':slug')
  findOnePublic(@Param('slug') slug: string, @Lang() lang: Language) {
    return this.blogsService.findOnePublicBySlug(slug, lang);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateBlogDto, @CurrentUser() user: AuthenticatedUser) {
    return this.blogsService.create(dto, user.id);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBlogDto) {
    return this.blogsService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.blogsService.remove(id);
  }
}

@Controller('blog-categories')
export class BlogCategoriesController {
  constructor(private readonly categoriesService: BlogCategoriesService) {}

  @Public()
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateBlogCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}

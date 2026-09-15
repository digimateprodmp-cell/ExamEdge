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
import { Role, Language } from '@prisma/client';
import {
  CurrentAffairCategoriesService,
  CurrentAffairsService,
} from './current-affairs.service';
import {
  CreateCurrentAffairCategoryDto,
  CreateCurrentAffairDto,
  UpdateCurrentAffairDto,
} from './dto/current-affair.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Lang } from '../common/decorators/lang.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('current-affairs')
export class CurrentAffairsController {
  constructor(private readonly currentAffairsService: CurrentAffairsService) {}

  @Public()
  @Get()
  findAllPublic(
    @Query() pagination: PaginationDto,
    @Lang() lang: Language,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.currentAffairsService.findAllPublic(
      pagination,
      lang,
      categoryId,
    );
  }

  @Roles(Role.ADMIN)
  @Get('admin')
  findAllAdmin(@Query() pagination: PaginationDto) {
    return this.currentAffairsService.findAllAdmin(pagination);
  }

  @Public()
  @Get(':id')
  findOnePublic(@Param('id') id: string, @Lang() lang: Language) {
    return this.currentAffairsService.findOnePublic(id, lang);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateCurrentAffairDto) {
    return this.currentAffairsService.create(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCurrentAffairDto) {
    return this.currentAffairsService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.currentAffairsService.remove(id);
  }
}

@Controller('current-affair-categories')
export class CurrentAffairCategoriesController {
  constructor(
    private readonly categoriesService: CurrentAffairCategoriesService,
  ) {}

  @Public()
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateCurrentAffairCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}

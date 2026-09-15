import { Module } from '@nestjs/common';
import {
  CurrentAffairCategoriesController,
  CurrentAffairsController,
} from './current-affairs.controller';
import {
  CurrentAffairCategoriesService,
  CurrentAffairsService,
} from './current-affairs.service';

@Module({
  controllers: [CurrentAffairsController, CurrentAffairCategoriesController],
  providers: [CurrentAffairsService, CurrentAffairCategoriesService],
  exports: [CurrentAffairsService, CurrentAffairCategoriesService],
})
export class CurrentAffairsModule {}

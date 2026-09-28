import { Module } from '@nestjs/common';
import {
  TestSectionQuestionsController,
  TestSectionsController,
} from './test-sections.controller';
import { TestSectionsService } from './test-sections.service';

@Module({
  controllers: [TestSectionsController, TestSectionQuestionsController],
  providers: [TestSectionsService],
})
export class TestSectionsModule {}

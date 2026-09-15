import { Module } from '@nestjs/common';
import { TestSeriesController } from './test-series.controller';
import { TestSeriesService } from './test-series.service';
import { TestVolumesController } from './test-volumes.controller';
import { TestVolumesService } from './test-volumes.service';

@Module({
  controllers: [TestSeriesController, TestVolumesController],
  providers: [TestSeriesService, TestVolumesService],
  exports: [TestSeriesService, TestVolumesService],
})
export class TestSeriesModule {}

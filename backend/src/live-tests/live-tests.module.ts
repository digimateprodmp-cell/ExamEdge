import { Module } from '@nestjs/common';
import { LiveTestsController } from './live-tests.controller';
import { LiveTestsService } from './live-tests.service';
import { LiveTestStateService } from './live-test-state.service';
import { LiveTestAttemptService } from './live-test-attempt.service';
import { IntegrityEventService } from './integrity-event.service';
import { AttemptsModule } from '../attempts/attempts.module';

@Module({
  imports: [AttemptsModule],
  controllers: [LiveTestsController],
  providers: [
    LiveTestsService,
    LiveTestStateService,
    LiveTestAttemptService,
    IntegrityEventService,
  ],
  exports: [LiveTestsService, LiveTestStateService],
})
export class LiveTestsModule {}

import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { EntitlementService } from './entitlement.service';

@Module({
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, EntitlementService],
  exports: [SubscriptionsService, EntitlementService],
})
export class SubscriptionsModule {}

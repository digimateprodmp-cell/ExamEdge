import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './common/prisma/prisma.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CatalogModule } from './catalog/catalog.module';
import { TestSeriesModule } from './test-series/test-series.module';
import { TestsModule } from './tests/tests.module';
import { QuestionsModule } from './questions/questions.module';
import { AttemptsModule } from './attempts/attempts.module';
import { NotesModule } from './notes/notes.module';
import { VideosModule } from './videos/videos.module';
import { BlogsModule } from './blogs/blogs.module';
import { CurrentAffairsModule } from './current-affairs/current-affairs.module';
import { BatchesModule } from './batches/batches.module';
import { CoinsModule } from './coins/coins.module';
import { CouponsModule } from './coupons/coupons.module';
import { PaymentsModule } from './payments/payments.module';
import { SystemModule } from './system/system.module';
import { ExamsModule } from './exams/exams.module';
import { StudentProfileModule } from './student-profile/student-profile.module';
import { LiveTestsModule } from './live-tests/live-tests.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { SlotsModule } from './slots/slots.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    CatalogModule,
    TestSeriesModule,
    TestsModule,
    QuestionsModule,
    AttemptsModule,
    NotesModule,
    VideosModule,
    BlogsModule,
    CurrentAffairsModule,
    BatchesModule,
    CoinsModule,
    CouponsModule,
    SubscriptionsModule,
    SlotsModule,
    PaymentsModule,
    SystemModule,
    ExamsModule,
    StudentProfileModule,
    LiveTestsModule,
    NotificationsModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}

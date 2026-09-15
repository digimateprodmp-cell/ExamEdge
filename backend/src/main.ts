import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(helmet());
  app.use(cookieParser());
  app.setGlobalPrefix('api');

  const origins = (
    config.get<string>('CORS_ORIGINS') ?? 'http://localhost:3000'
  )
    .split(',')
    .map((origin) => origin.trim());

  app.enableCors({
    origin: origins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      // whitelist strips any body/query field a DTO doesn't declare (e.g. a
      // tampered "score" on an attempt-answer body, or "lang"/"categoryId"
      // riding alongside a PaginationDto on the same query string) rather
      // than rejecting the whole request outright.
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const port = config.get<number>('PORT', 4000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Test Mela API listening on http://localhost:${port}/api`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start Test Mela API', err);
  process.exit(1);
});

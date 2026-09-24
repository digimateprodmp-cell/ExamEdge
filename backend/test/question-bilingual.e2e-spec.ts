process.env.RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy';
process.env.RAZORPAY_KEY_SECRET =
  process.env.RAZORPAY_KEY_SECRET || 'dummy_secret_for_e2e';

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('Bilingual question publishing (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  const createdIds: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@testmela.com', password: 'Admin@123' })
      .expect(200);
    adminToken = adminLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.question.deleteMany({ where: { id: { in: createdIds } } });
    await app.close();
  });

  it('a question created with only English is MISSING_HINDI and cannot be published', async () => {
    const create = await request(app.getHttpServer())
      .post('/api/questions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        textEn: 'What is the capital of India?',
        options: [
          { textEn: 'Delhi', isCorrect: true },
          { textEn: 'Mumbai', isCorrect: false },
        ],
      })
      .expect(201);

    const question = create.body.data;
    createdIds.push(question.id);
    expect(question.status).toBe('MISSING_HINDI');

    await request(app.getHttpServer())
      .post(`/api/questions/${question.id}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(400);

    const reloaded = await prisma.question.findUniqueOrThrow({
      where: { id: question.id },
    });
    expect(reloaded.status).toBe('MISSING_HINDI');
  });

  it('a question with English + Hindi on the question but not every option is LANGUAGE_REVIEW_REQUIRED', async () => {
    const create = await request(app.getHttpServer())
      .post('/api/questions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        textEn: 'What is the capital of India?',
        textHi: 'भारत की राजधानी क्या है?',
        options: [
          { textEn: 'Delhi', textHi: 'दिल्ली', isCorrect: true },
          { textEn: 'Mumbai', isCorrect: false }, // no Hindi on this option
        ],
      })
      .expect(201);

    const question = create.body.data;
    createdIds.push(question.id);
    expect(question.status).toBe('LANGUAGE_REVIEW_REQUIRED');

    await request(app.getHttpServer())
      .post(`/api/questions/${question.id}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(400);
  });

  it('a genuinely bilingual-complete question becomes PENDING_REVIEW and can be published', async () => {
    const create = await request(app.getHttpServer())
      .post('/api/questions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        textEn: 'What is the capital of India?',
        textHi: 'भारत की राजधानी क्या है?',
        explanationEn: 'Delhi is the capital.',
        explanationHi: 'दिल्ली राजधानी है।',
        options: [
          { textEn: 'Delhi', textHi: 'दिल्ली', isCorrect: true },
          { textEn: 'Mumbai', textHi: 'मुंबई', isCorrect: false },
        ],
      })
      .expect(201);

    const question = create.body.data;
    createdIds.push(question.id);
    expect(question.status).toBe('PENDING_REVIEW');

    const publish = await request(app.getHttpServer())
      .post(`/api/questions/${question.id}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);
    expect(publish.body.data.status).toBe('PUBLISHED');

    // Editing an already-PUBLISHED question does not silently downgrade its
    // status back to a language-incomplete one just because the edit
    // transiently looks incomplete mid-save (never auto-un-publishes).
    const edit = await request(app.getHttpServer())
      .patch(`/api/questions/${question.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ marks: 2 })
      .expect(200);
    expect(edit.body.data.status).toBe('PUBLISHED');
  });

  it('the correct-answer mapping cannot diverge between languages, by construction', async () => {
    // isCorrect lives on the shared QuestionOption row, not per-translation -
    // there is no request shape that could mark an option correct in one
    // language and incorrect in the other.
    const create = await request(app.getHttpServer())
      .post('/api/questions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        textEn: 'Q',
        textHi: 'Q-HI',
        options: [
          { textEn: 'A', textHi: 'A-HI', isCorrect: true },
          { textEn: 'B', textHi: 'B-HI', isCorrect: false },
        ],
      })
      .expect(201);
    createdIds.push(create.body.data.id);

    const option = create.body.data.options[0];
    expect(
      option.translations.every((t: { language: string }) =>
        ['EN', 'HI'].includes(t.language),
      ),
    ).toBe(true);
    expect(
      create.body.data.options.filter(
        (o: { isCorrect: boolean }) => o.isCorrect,
      ),
    ).toHaveLength(1);
  });
});

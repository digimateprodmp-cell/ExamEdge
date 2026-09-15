process.env.RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy';
process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'dummy_secret_for_e2e';

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { PaymentStatus, PaymentItemType } from '@prisma/client';

describe('Test Mela API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let studentToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }));
    await app.init();

    prisma = app.get(PrismaService);

    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@testmela.com', password: 'Admin@123' })
      .expect(200);
    adminToken = adminLogin.body.data.accessToken;

    const studentLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'student@testmela.com', password: 'Student@123' })
      .expect(200);
    studentToken = studentLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects a non-admin calling an admin-only endpoint', async () => {
    await request(app.getHttpServer())
      .post('/api/courses')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ titleEn: 'Should not be created' })
      .expect(403);
  });

  it('allows an admin to reach the same admin-only endpoint', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/courses/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.success).toBe(true);
  });

  it('computes the test score server-side and ignores a tampered score/isCorrect in the request body', async () => {
    const start = await request(app.getHttpServer())
      .post('/api/attempts/start')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ testId: 'seed-test-ancient-history-01', language: 'EN' })
      .expect(200);

    const attempt = start.body.data;
    expect(attempt.status).toBe('IN_PROGRESS');
    const firstQuestion = attempt.questions[0];

    // Look up the real correct option directly from the DB (never exposed to
    // an in-progress attempt) so we can send a genuinely correct answer.
    const correctOption = await prisma.questionOption.findFirstOrThrow({
      where: { questionId: firstQuestion.questionId, isCorrect: true },
    });
    const question = await prisma.question.findUniqueOrThrow({ where: { id: firstQuestion.questionId } });

    const tamperRes = await request(app.getHttpServer())
      .patch(`/api/attempts/${attempt.id}/answers/${firstQuestion.testQuestionId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        selectedOptionId: correctOption.id,
        // none of these fields exist on SaveAnswerDto — whitelist:true must
        // strip them silently rather than letting them influence anything
        isCorrect: true,
        marksAwarded: 999999,
        score: 999999,
      })
      .expect(200);
    expect(tamperRes.body.data.saved).toBe(true);

    const submitRes = await request(app.getHttpServer())
      .post(`/api/attempts/${attempt.id}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    const result = submitRes.body.data;
    expect(result.status).toBe('SUBMITTED');
    // Exactly one question answered correctly, everything else unattempted:
    // score must equal that one question's real marks, never the tampered value.
    expect(Number(result.score)).toBe(Number(question.marks));
    expect(result.correctCount).toBe(1);
    expect(result.unattemptedCount).toBe(attempt.questions.length - 1);
  });

  it('rejects a payment verification with a forged signature', async () => {
    const student = await prisma.user.findUniqueOrThrow({ where: { email: 'student@testmela.com' } });

    const payment = await prisma.payment.create({
      data: {
        userId: student.id,
        razorpayOrderId: `E2E-TEST-ORDER-${Date.now()}`,
        amount: 999,
        status: PaymentStatus.CREATED,
        itemType: PaymentItemType.COURSE,
        itemId: 'seed-course-upsc-foundation',
      },
    });

    await request(app.getHttpServer())
      .post('/api/payments/verify')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        razorpayOrderId: payment.razorpayOrderId,
        razorpayPaymentId: 'fake_payment_id',
        razorpaySignature: 'not-a-real-signature',
      })
      .expect(400);

    const reloaded = await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
    expect(reloaded.status).toBe(PaymentStatus.FAILED);
  });
});

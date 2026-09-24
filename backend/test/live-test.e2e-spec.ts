process.env.RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy';
process.env.RAZORPAY_KEY_SECRET =
  process.env.RAZORPAY_KEY_SECRET || 'dummy_secret_for_e2e';

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { SlotsService } from '../src/slots/slots.service';
import { LiveAttemptStatus, LiveTestStatus } from '@prisma/client';

const SEED_TEST_ID = 'seed-test-ancient-history-01';

describe('Live Test engine (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let slotsService: SlotsService;
  let adminToken: string;
  let studentToken: string;
  let studentId: string;
  const createdLiveTestIds: string[] = [];

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
    slotsService = app.get(SlotsService);

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
    const student = await prisma.user.findUniqueOrThrow({
      where: { email: 'student@testmela.com' },
    });
    studentId = student.id;
  });

  afterAll(async () => {
    // Clean up everything this file created so re-runs stay idempotent.
    await prisma.examIntegrityEvent.deleteMany({
      where: { liveTestId: { in: createdLiveTestIds } },
    });
    await prisma.liveTestAttempt.deleteMany({
      where: { liveTestId: { in: createdLiveTestIds } },
    });
    await prisma.liveTestAuditLog.deleteMany({
      where: { liveTestId: { in: createdLiveTestIds } },
    });
    await prisma.testSlot.deleteMany({
      where: { liveTestId: { in: createdLiveTestIds } },
    });
    await prisma.liveTest.deleteMany({
      where: { id: { in: createdLiveTestIds } },
    });
    await app.close();
  });

  async function createLiveTest(
    overrides: Partial<{ startAt: Date; endAt: Date; allowLateEntry: boolean }>,
  ) {
    const now = Date.now();
    const liveTest = await prisma.liveTest.create({
      data: {
        title: `E2E Live Test ${Date.now()}`,
        testId: SEED_TEST_ID,
        startAt: overrides.startAt ?? new Date(now - 60_000),
        endAt: overrides.endAt ?? new Date(now + 5 * 60_000),
        durationMinutes: 5,
        allowLateEntry: overrides.allowLateEntry ?? false,
        status: LiveTestStatus.LIVE,
      },
    });
    createdLiveTestIds.push(liveTest.id);
    return liveTest;
  }

  it('rejects joining a live test scheduled more than the 1-hour countdown window away', async () => {
    const liveTest = await createLiveTest({
      startAt: new Date(Date.now() + 2 * 60 * 60_000),
      endAt: new Date(Date.now() + 3 * 60 * 60_000),
    });

    await request(app.getHttpServer())
      .post(`/api/live-tests/${liveTest.id}/join`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(400);
  });

  it('rejects joining a live test after its end time', async () => {
    const liveTest = await createLiveTest({
      startAt: new Date(Date.now() - 10 * 60_000),
      endAt: new Date(Date.now() - 5 * 60_000),
    });

    await request(app.getHttpServer())
      .post(`/api/live-tests/${liveTest.id}/join`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(400);
  });

  it("a late entrant's expiresAt is the live test's fixed endAt, never a fresh full duration", async () => {
    const endAt = new Date(Date.now() + 90_000); // ends in 90s
    const liveTest = await createLiveTest({
      startAt: new Date(Date.now() - 3 * 60_000), // started 3 min ago
      endAt,
      allowLateEntry: true,
    });

    const joinRes = await request(app.getHttpServer())
      .post(`/api/live-tests/${liveTest.id}/join`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    const returnedExpiresAt = new Date(
      joinRes.body.data.attempt.expiresAt,
    ).getTime();
    // Must equal the live test's endAt (within a second of clock skew), NOT
    // now + durationMinutes*60s, which would be ~5 minutes away instead of ~90s.
    expect(Math.abs(returnedExpiresAt - endAt.getTime())).toBeLessThan(2000);
  });

  it('rejects an answer submitted after the official end time even though the client sends it', async () => {
    const liveTest = await createLiveTest({
      startAt: new Date(Date.now() - 2 * 60_000),
      endAt: new Date(Date.now() + 3000), // ends in 3s
      allowLateEntry: true,
    });

    const joinRes = await request(app.getHttpServer())
      .post(`/api/live-tests/${liveTest.id}/join`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    const { liveTestAttemptId, attempt } = joinRes.body.data;
    const firstQuestion = attempt.questions[0];

    await new Promise((r) => setTimeout(r, 3500)); // let the end time pass

    await request(app.getHttpServer())
      .patch(
        `/api/live-tests/attempts/${liveTestAttemptId}/answers/${firstQuestion.testQuestionId}`,
      )
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ selectedOptionId: firstQuestion.options[0].id })
      .expect(400);
  });

  it('first violation warns, second violation terminates and preserves the last saved answer + score', async () => {
    const liveTest = await createLiveTest({ allowLateEntry: true });
    const joinRes = await request(app.getHttpServer())
      .post(`/api/live-tests/${liveTest.id}/join`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    const { liveTestAttemptId, attempt } = joinRes.body.data;
    const firstQuestion = attempt.questions[0];

    const correctOption = await prisma.questionOption.findFirstOrThrow({
      where: { questionId: firstQuestion.questionId, isCorrect: true },
    });
    const question = await prisma.question.findUniqueOrThrow({
      where: { id: firstQuestion.questionId },
    });

    await request(app.getHttpServer())
      .patch(
        `/api/live-tests/attempts/${liveTestAttemptId}/answers/${firstQuestion.testQuestionId}`,
      )
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ selectedOptionId: correctOption.id })
      .expect(200);

    const first = await request(app.getHttpServer())
      .post(`/api/live-tests/attempts/${liveTestAttemptId}/integrity-events`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ eventType: 'BLOCKED_SHORTCUT', keyCombination: 'ctrl+c' })
      .expect(200);
    expect(first.body.data.action).toBe('WARNING');

    const second = await request(app.getHttpServer())
      .post(`/api/live-tests/attempts/${liveTestAttemptId}/integrity-events`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ eventType: 'BLOCKED_SHORTCUT', keyCombination: 'ctrl+c' })
      .expect(200);
    expect(second.body.data.action).toBe('TERMINATED');

    const finalAttempt = await prisma.liveTestAttempt.findUniqueOrThrow({
      where: { id: liveTestAttemptId },
    });
    expect(finalAttempt.status).toBe(
      LiveAttemptStatus.TERMINATED_FOR_VIOLATION,
    );

    const testAttempt = await prisma.testAttempt.findUniqueOrThrow({
      where: { id: finalAttempt.testAttemptId },
    });
    expect(testAttempt.status).toBe('AUTO_SUBMITTED');
    expect(Number(testAttempt.score)).toBe(Number(question.marks));
    expect(testAttempt.correctCount).toBe(1);

    // A terminated attempt cannot be resumed — joining again returns the
    // same terminated record and further submission is rejected, not restarted.
    await request(app.getHttpServer())
      .post(`/api/live-tests/${liveTest.id}/join`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(403);
  });

  it('two concurrent reservations on a 1-seat slot: exactly one succeeds', async () => {
    const liveTest = await createLiveTest({});
    const slot = await prisma.testSlot.create({
      data: {
        liveTestId: liveTest.id,
        startAt: liveTest.startAt,
        endAt: liveTest.endAt,
        capacity: 1,
      },
    });

    const otherUser = await prisma.user.create({
      data: {
        name: 'E2E Concurrent User',
        email: `e2e-concurrent-${Date.now()}@testmela.com`,
        passwordHash: 'x',
        referralCode: `E2ECC${Date.now()}`,
      },
    });

    const results = await Promise.allSettled([
      slotsService.reserve(studentId, slot.id),
      slotsService.reserve(otherUser.id, slot.id),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const reloadedSlot = await prisma.testSlot.findUniqueOrThrow({
      where: { id: slot.id },
    });
    expect(reloadedSlot.bookedCount).toBe(1);

    await prisma.slotReservation.deleteMany({ where: { slotId: slot.id } });
    await prisma.testSlot.delete({ where: { id: slot.id } });
    await prisma.user.delete({ where: { id: otherUser.id } });
  });
});

process.env.RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy';
process.env.RAZORPAY_KEY_SECRET =
  process.env.RAZORPAY_KEY_SECRET || 'dummy_secret_for_e2e';

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test as NestTest } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

const SEED_TEST_ID = 'seed-test-ancient-history-01';

describe('Legacy grandfathering / dual-mode bilingual gate (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let studentToken: string;
  const createdQuestionIds: string[] = [];
  const createdTestIds: string[] = [];
  const createdLiveTestIds: string[] = [];

  beforeAll(async () => {
    const moduleRef = await NestTest.createTestingModule({
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

    const studentLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'student@testmela.com', password: 'Student@123' })
      .expect(200);
    studentToken = studentLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.liveTest.deleteMany({
      where: { id: { in: createdLiveTestIds } },
    });
    await prisma.testQuestion.deleteMany({
      where: { testId: { in: createdTestIds } },
    });
    await prisma.test.deleteMany({ where: { id: { in: createdTestIds } } });
    await prisma.question.deleteMany({
      where: { id: { in: createdQuestionIds } },
    });
    await app.close();
  });

  describe('Rule 1/4: legacy questions retain truthful status and get LEGACY_TEMPORARY eligibility', () => {
    it('every pre-existing (legacy) question is isLegacyGrandfathered with LEGACY_TEMPORARY eligibility and a truthful (non-PUBLISHED) status', async () => {
      const legacySample = await prisma.question.findMany({
        where: { isLegacyGrandfathered: true },
        take: 5,
      });
      expect(legacySample.length).toBeGreaterThan(0);
      for (const q of legacySample) {
        expect(q.servingEligibility).toBe('LEGACY_TEMPORARY');
        // Never falsely marked PUBLISHED merely to make it servable.
        expect(q.status).not.toBe('PUBLISHED');
        expect([
          'MISSING_ENGLISH',
          'MISSING_HINDI',
          'PENDING_REVIEW',
          'LANGUAGE_REVIEW_REQUIRED',
          'DRAFT',
        ]).toContain(q.status);
      }
    });

    it('no existing question was deleted by this migration/backfill', async () => {
      const count = await prisma.question.count({
        where: { isLegacyGrandfathered: true },
      });
      expect(count).toBe(6271);
    });
  });

  describe('Rule 5: existing legacy practice tests continue functioning unchanged', () => {
    it('a legacy practice test (bilingualRequired=false, non-bilingual questions) still starts and scores normally', async () => {
      const test = await prisma.test.findUniqueOrThrow({
        where: { id: SEED_TEST_ID },
      });
      expect(test.bilingualRequired).toBe(false);

      const start = await request(app.getHttpServer())
        .post('/api/attempts/start')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ testId: SEED_TEST_ID, language: 'EN' })
        .expect(200);
      expect(start.body.data.status).toBe('IN_PROGRESS');
      expect(start.body.data.questions.length).toBeGreaterThan(0);
    });
  });

  describe('Rule 2/3: newly created questions must satisfy the strict gate, never grandfathered', () => {
    it('a brand-new incomplete question is NOT_ELIGIBLE (not LEGACY_TEMPORARY) and isLegacyGrandfathered=false', async () => {
      const create = await request(app.getHttpServer())
        .post('/api/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          textEn: 'A brand new English-only question',
          options: [
            { textEn: 'A', isCorrect: true },
            { textEn: 'B', isCorrect: false },
          ],
        })
        .expect(201);
      createdQuestionIds.push(create.body.data.id);

      const reloaded = await prisma.question.findUniqueOrThrow({
        where: { id: create.body.data.id },
      });
      expect(reloaded.isLegacyGrandfathered).toBe(false);
      expect(reloaded.servingEligibility).toBe('NOT_ELIGIBLE');
      expect(reloaded.status).toBe('MISSING_HINDI');
    });
  });

  describe('Rule 5/6: BILINGUAL_REQUIRED test/live-test selection rejects incomplete questions', () => {
    it('adding a NOT_ELIGIBLE question to a bilingualRequired=true test is rejected', async () => {
      const incomplete = await request(app.getHttpServer())
        .post('/api/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          textEn: 'English only, incomplete',
          options: [
            { textEn: 'A', isCorrect: true },
            { textEn: 'B', isCorrect: false },
          ],
        })
        .expect(201);
      createdQuestionIds.push(incomplete.body.data.id);

      const volume = await prisma.testVolume.findFirstOrThrow();
      const newTest = await request(app.getHttpServer())
        .post('/api/tests')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          testVolumeId: volume.id,
          titleEn: 'New bilingual-required test',
          // bilingualRequired omitted -> defaults to true
        })
        .expect(201);
      createdTestIds.push(newTest.body.data.id);
      expect(newTest.body.data.bilingualRequired).toBe(true);

      await request(app.getHttpServer())
        .post(`/api/tests/${newTest.body.data.id}/questions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ questionId: incomplete.body.data.id })
        .expect(400);
    });

    it('adding a FULLY_ELIGIBLE (published, bilingual-complete) question to a bilingualRequired=true test succeeds', async () => {
      const complete = await request(app.getHttpServer())
        .post('/api/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          textEn: 'Complete bilingual question',
          textHi: 'पूर्ण द्विभाषी प्रश्न',
          options: [
            { textEn: 'A', textHi: 'ए', isCorrect: true },
            { textEn: 'B', textHi: 'बी', isCorrect: false },
          ],
        })
        .expect(201);
      createdQuestionIds.push(complete.body.data.id);

      await request(app.getHttpServer())
        .post(`/api/questions/${complete.body.data.id}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      const volume = await prisma.testVolume.findFirstOrThrow();
      const newTest = await request(app.getHttpServer())
        .post('/api/tests')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ testVolumeId: volume.id, titleEn: 'Bilingual test 2' })
        .expect(201);
      createdTestIds.push(newTest.body.data.id);

      await request(app.getHttpServer())
        .post(`/api/tests/${newTest.body.data.id}/questions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ questionId: complete.body.data.id })
        .expect(201);
    });

    it('creating a new Live Test (bilingualRequired defaults true) against a legacy paper with ineligible questions is rejected', async () => {
      await request(app.getHttpServer())
        .post('/api/live-tests')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Should be rejected - legacy paper not bilingual-complete',
          testId: SEED_TEST_ID, // the legacy seed test, full of MISSING_ENGLISH questions
          startAt: new Date(Date.now() + 3600_000).toISOString(),
          endAt: new Date(Date.now() + 7200_000).toISOString(),
          durationMinutes: 30,
        })
        .expect(400);
    });

    it('creating a Live Test with bilingualRequired: false against the same legacy paper is allowed (preserves existing legacy behavior)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/live-tests')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title:
            'Legacy-content live test, explicitly opted out of bilingual gate',
          testId: SEED_TEST_ID,
          startAt: new Date(Date.now() + 3600_000).toISOString(),
          endAt: new Date(Date.now() + 7200_000).toISOString(),
          durationMinutes: 30,
          bilingualRequired: false,
        })
        .expect(201);
      createdLiveTestIds.push(res.body.data.id);
      expect(res.body.data.bilingualRequired).toBe(false);
    });
  });

  describe('Rule 7: migration progress stats are real, queried counts', () => {
    it('GET /api/questions/stats reports the actual distribution', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/questions/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.totalLegacy).toBe(6271);
      expect(res.body.data.byStatus.MISSING_ENGLISH).toBeGreaterThanOrEqual(
        6266,
      );
      expect(res.body.data.byStatus.PENDING_REVIEW).toBeGreaterThanOrEqual(3);
      expect(
        res.body.data.byServingEligibility.LEGACY_TEMPORARY,
      ).toBeGreaterThanOrEqual(6271);
    });
  });
});

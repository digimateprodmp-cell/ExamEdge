import { PrismaClient, Role, Language, TestType, TestStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const studentPasswordHash = await bcrypt.hash('Student@123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@testmela.com' },
    update: {},
    create: {
      name: 'Test Mela Admin',
      email: 'admin@testmela.com',
      phone: '9000000001',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      referralCode: 'ADMIN0001',
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@testmela.com' },
    update: {},
    create: {
      name: 'Rahul Kumar',
      email: 'student@testmela.com',
      phone: '9000000002',
      passwordHash: studentPasswordHash,
      role: Role.STUDENT,
      referralCode: 'STUDENT01',
      state: 'Bihar',
      coinBalance: 120,
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  });

  const subject = await prisma.subject.upsert({
    where: { id: 'seed-subject-history' },
    update: {},
    create: { id: 'seed-subject-history', nameEn: 'History', nameHi: 'इतिहास' },
  });

  const topic = await prisma.topic.upsert({
    where: { id: 'seed-topic-ancient-history' },
    update: {},
    create: {
      id: 'seed-topic-ancient-history',
      subjectId: subject.id,
      nameEn: 'Ancient History',
      nameHi: 'प्राचीन इतिहास',
    },
  });

  const course = await prisma.course.upsert({
    where: { id: 'seed-course-upsc-foundation' },
    update: {},
    create: {
      id: 'seed-course-upsc-foundation',
      titleEn: 'UPSC Foundation 2026',
      titleHi: 'यूपीएससी फाउंडेशन 2026',
      descriptionEn: 'Full syllabus batch for UPSC Prelims & Mains 2026.',
      descriptionHi: 'यूपीएससी प्रारंभिक एवं मुख्य परीक्षा 2026 के लिए पूर्ण पाठ्यक्रम बैच।',
      isFree: false,
      price: 4999,
      isPublished: true,
    },
  });

  const testSeries = await prisma.testSeries.upsert({
    where: { id: 'seed-test-series-prelims-mock' },
    update: {},
    create: {
      id: 'seed-test-series-prelims-mock',
      courseId: course.id,
      titleEn: 'UPSC Prelims Mock Series',
      titleHi: 'यूपीएससी प्रारंभिक मॉक सीरीज़',
      descriptionEn: '30 full length mock tests with detailed explanations & performance analysis.',
      descriptionHi: 'विस्तृत व्याख्या और प्रदर्शन विश्लेषण के साथ 30 पूर्ण लंबाई के मॉक टेस्ट।',
      validityDays: 365,
      isFree: false,
      price: 999,
      isPublished: true,
    },
  });

  const testVolume = await prisma.testVolume.upsert({
    where: { id: 'seed-test-volume-ancient-history' },
    update: {},
    create: {
      id: 'seed-test-volume-ancient-history',
      testSeriesId: testSeries.id,
      titleEn: 'Ancient History Sectional Tests',
      titleHi: 'प्राचीन इतिहास खंडीय परीक्षण',
      order: 0,
    },
  });

  const test = await prisma.test.upsert({
    where: { id: 'seed-test-ancient-history-01' },
    update: {},
    create: {
      id: 'seed-test-ancient-history-01',
      testVolumeId: testVolume.id,
      titleEn: 'Ancient History – Test Set #01',
      titleHi: 'प्राचीन इतिहास – टेस्ट सेट #01',
      instructionsEn: 'Each question carries 2 marks. There is a negative marking of 0.5 for every wrong answer.',
      instructionsHi: 'प्रत्येक प्रश्न 2 अंकों का है। प्रत्येक गलत उत्तर के लिए 0.5 अंक की नकारात्मक अंकन है।',
      type: TestType.PRACTICE,
      status: TestStatus.PUBLISHED,
      durationMinutes: 10,
      marksPerQuestion: 2,
      negativeMarks: 0.5,
      isFree: true,
      price: 0,
    },
  });

  const questionSeeds = [
    {
      id: 'seed-q1',
      textEn: 'Who built the Great Bath at Mohenjo-daro?',
      textHi: 'मोहनजोदड़ो में ग्रेट बाथ किसने बनवाया था?',
      explanationEn: 'The Great Bath was built by the Indus Valley Civilization as a public water tank.',
      explanationHi: 'ग्रेट बाथ सिंधु घाटी सभ्यता द्वारा एक सार्वजनिक जल टंकी के रूप में बनाया गया था।',
      options: [
        { textEn: 'Indus Valley Civilization', textHi: 'सिंधु घाटी सभ्यता', isCorrect: true },
        { textEn: 'Mauryan Empire', textHi: 'मौर्य साम्राज्य', isCorrect: false },
        { textEn: 'Gupta Empire', textHi: 'गुप्त साम्राज्य', isCorrect: false },
        { textEn: 'Chola Dynasty', textHi: 'चोल राजवंश', isCorrect: false },
      ],
    },
    {
      id: 'seed-q2',
      textEn: 'Which river was the Indus Valley Civilization primarily situated around?',
      textHi: null,
      explanationEn: 'The civilization flourished along the Indus river and its tributaries.',
      explanationHi: null,
      options: [
        { textEn: 'Indus', textHi: null, isCorrect: true },
        { textEn: 'Ganges', textHi: null, isCorrect: false },
        { textEn: 'Godavari', textHi: null, isCorrect: false },
        { textEn: 'Narmada', textHi: null, isCorrect: false },
      ],
    },
    {
      id: 'seed-q3',
      textEn: null,
      textHi: 'बौद्ध धर्म के संस्थापक कौन थे?',
      explanationEn: null,
      explanationHi: 'गौतम बुद्ध ने छठी शताब्दी ईसा पूर्व में बौद्ध धर्म की स्थापना की।',
      options: [
        { textEn: null, textHi: 'गौतम बुद्ध', isCorrect: true },
        { textEn: null, textHi: 'महावीर', isCorrect: false },
        { textEn: null, textHi: 'आदि शंकराचार्य', isCorrect: false },
        { textEn: null, textHi: 'कबीर', isCorrect: false },
      ],
    },
    {
      id: 'seed-q4',
      textEn: 'The Ashokan edicts were primarily written in which script?',
      textHi: 'अशोक के शिलालेख मुख्यतः किस लिपि में लिखे गए थे?',
      explanationEn: 'Most edicts were inscribed in the Brahmi script.',
      explanationHi: 'अधिकांश शिलालेख ब्राह्मी लिपि में उत्कीर्ण किए गए थे।',
      options: [
        { textEn: 'Brahmi', textHi: 'ब्राह्मी', isCorrect: true },
        { textEn: 'Kharosthi', textHi: 'खरोष्ठी', isCorrect: false },
        { textEn: 'Devanagari', textHi: 'देवनागरी', isCorrect: false },
        { textEn: 'Tamil', textHi: 'तमिल', isCorrect: false },
      ],
    },
    {
      id: 'seed-q5',
      textEn: 'Who was the founder of the Maurya Empire?',
      textHi: 'मौर्य साम्राज्य की स्थापना किसने की थी?',
      explanationEn: 'Chandragupta Maurya founded the Maurya Empire around 321 BCE.',
      explanationHi: 'चंद्रगुप्त मौर्य ने लगभग 321 ईसा पूर्व मौर्य साम्राज्य की स्थापना की।',
      options: [
        { textEn: 'Chandragupta Maurya', textHi: 'चंद्रगुप्त मौर्य', isCorrect: true },
        { textEn: 'Bindusara', textHi: 'बिंदुसार', isCorrect: false },
        { textEn: 'Ashoka', textHi: 'अशोक', isCorrect: false },
        { textEn: 'Kautilya', textHi: 'कौटिल्य', isCorrect: false },
      ],
    },
  ];

  for (let i = 0; i < questionSeeds.length; i++) {
    const q = questionSeeds[i];
    const question = await prisma.question.upsert({
      where: { id: q.id },
      update: {},
      create: {
        id: q.id,
        subjectId: subject.id,
        topicId: topic.id,
        marks: 2,
        negativeMarks: 0.5,
        createdById: admin.id,
      },
    });

    if (q.textEn) {
      await prisma.questionTranslation.upsert({
        where: { questionId_language: { questionId: question.id, language: Language.EN } },
        update: {},
        create: {
          questionId: question.id,
          language: Language.EN,
          text: q.textEn,
          explanation: q.explanationEn ?? undefined,
        },
      });
    }
    if (q.textHi) {
      await prisma.questionTranslation.upsert({
        where: { questionId_language: { questionId: question.id, language: Language.HI } },
        update: {},
        create: {
          questionId: question.id,
          language: Language.HI,
          text: q.textHi,
          explanation: q.explanationHi ?? undefined,
        },
      });
    }

    const existingOptions = await prisma.questionOption.findMany({ where: { questionId: question.id } });
    if (existingOptions.length === 0) {
      for (let j = 0; j < q.options.length; j++) {
        const opt = q.options[j];
        const option = await prisma.questionOption.create({
          data: { questionId: question.id, order: j, isCorrect: opt.isCorrect },
        });
        if (opt.textEn) {
          await prisma.optionTranslation.create({
            data: { optionId: option.id, language: Language.EN, text: opt.textEn },
          });
        }
        if (opt.textHi) {
          await prisma.optionTranslation.create({
            data: { optionId: option.id, language: Language.HI, text: opt.textHi },
          });
        }
      }
    }

    await prisma.testQuestion.upsert({
      where: { testId_questionId: { testId: test.id, questionId: question.id } },
      update: {},
      create: { testId: test.id, questionId: question.id, order: i },
    });
  }

  const blogCategory = await prisma.blogCategory.upsert({
    where: { id: 'seed-blog-category-exam-tips' },
    update: {},
    create: { id: 'seed-blog-category-exam-tips', nameEn: 'Exam Tips', nameHi: 'परीक्षा सुझाव' },
  });

  const blog = await prisma.blog.upsert({
    where: { id: 'seed-blog-1' },
    update: {},
    create: {
      id: 'seed-blog-1',
      slug: 'how-to-prepare-for-upsc-prelims',
      categoryId: blogCategory.id,
      authorId: admin.id,
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  await prisma.blogTranslation.upsert({
    where: { blogId_language: { blogId: blog.id, language: Language.EN } },
    update: {},
    create: {
      blogId: blog.id,
      language: Language.EN,
      title: 'How to Prepare for UPSC Prelims in 6 Months',
      excerpt: 'A structured 6-month plan covering static GS, current affairs, and revision.',
      content:
        'A disciplined daily routine combining NCERTs, current affairs and regular mock tests is the fastest way to crack UPSC Prelims within six months.',
    },
  });

  await prisma.blogTranslation.upsert({
    where: { blogId_language: { blogId: blog.id, language: Language.HI } },
    update: {},
    create: {
      blogId: blog.id,
      language: Language.HI,
      title: '6 महीनों में यूपीएससी प्रारंभिक परीक्षा की तैयारी कैसे करें',
      excerpt: 'स्टैटिक जीएस, करंट अफेयर्स और रिवीजन को कवर करने वाली एक संरचित 6 महीने की योजना।',
      content:
        'एनसीईआरटी, करंट अफेयर्स और नियमित मॉक टेस्ट को जोड़ने वाली एक अनुशासित दैनिक दिनचर्या छह महीनों में यूपीएससी प्रारंभिक परीक्षा पास करने का सबसे तेज़ तरीका है।',
    },
  });

  const caCategory = await prisma.currentAffairCategory.upsert({
    where: { id: 'seed-ca-category-national' },
    update: {},
    create: { id: 'seed-ca-category-national', nameEn: 'National', nameHi: 'राष्ट्रीय' },
  });

  const currentAffair = await prisma.currentAffair.upsert({
    where: { id: 'seed-ca-1' },
    update: {},
    create: {
      id: 'seed-ca-1',
      date: new Date(),
      categoryId: caCategory.id,
      isPublished: true,
    },
  });

  await prisma.currentAffairTranslation.upsert({
    where: { currentAffairId_language: { currentAffairId: currentAffair.id, language: Language.EN } },
    update: {},
    create: {
      currentAffairId: currentAffair.id,
      language: Language.EN,
      title: 'India launches new scholarship program for competitive exam aspirants',
      content: 'The scheme aims to support students from economically weaker sections preparing for UPSC and state PCS exams.',
    },
  });

  await prisma.currentAffairTranslation.upsert({
    where: { currentAffairId_language: { currentAffairId: currentAffair.id, language: Language.HI } },
    update: {},
    create: {
      currentAffairId: currentAffair.id,
      language: Language.HI,
      title: 'भारत ने प्रतियोगी परीक्षा उम्मीदवारों के लिए नई छात्रवृत्ति योजना शुरू की',
      content: 'इस योजना का उद्देश्य यूपीएससी और राज्य पीसीएस परीक्षाओं की तैयारी कर रहे आर्थिक रूप से कमजोर वर्गों के छात्रों का समर्थन करना है।',
    },
  });

  await prisma.batch.upsert({
    where: { id: 'seed-batch-1' },
    update: {},
    create: {
      id: 'seed-batch-1',
      titleEn: 'UPSC Foundation Batch 2026',
      titleHi: 'यूपीएससी फाउंडेशन बैच 2026',
      descriptionEn: 'Complete foundation batch with live classes, tests and notes.',
      descriptionHi: 'लाइव कक्षाओं, परीक्षणों और नोट्स के साथ संपूर्ण फाउंडेशन बैच।',
      isFree: false,
      price: 7999,
      isPublished: true,
    },
  });

  console.log('Seed complete.');
  console.log(`Admin login:   admin@testmela.com / Admin@123`);
  console.log(`Student login: student@testmela.com / Student@123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

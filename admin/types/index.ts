export type Role = 'STUDENT' | 'ADMIN';
export type Language = 'EN' | 'HI';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
  coinBalance: number;
  createdAt: string;
}

export interface Subject {
  id: string;
  nameEn: string;
  nameHi?: string | null;
  topics?: Topic[];
}

export interface Topic {
  id: string;
  subjectId: string;
  nameEn: string;
  nameHi?: string | null;
}

export interface Course {
  id: string;
  titleEn: string;
  titleHi?: string | null;
  descriptionEn?: string | null;
  descriptionHi?: string | null;
  isFree: boolean;
  price: string;
  isPublished: boolean;
}

export interface TestSeries {
  id: string;
  courseId?: string | null;
  titleEn: string;
  titleHi?: string | null;
  descriptionEn?: string | null;
  descriptionHi?: string | null;
  validityDays: number;
  isFree: boolean;
  price: string;
  isPublished: boolean;
  volumes?: TestVolume[];
}

export interface TestVolume {
  id: string;
  testSeriesId: string;
  titleEn: string;
  titleHi?: string | null;
  order: number;
}

export type TestType = 'LIVE' | 'PRACTICE' | 'PDF';
export type TestStatusValue = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface Test {
  id: string;
  testVolumeId: string;
  titleEn: string;
  titleHi?: string | null;
  instructionsEn?: string | null;
  instructionsHi?: string | null;
  type: TestType;
  status: TestStatusValue;
  durationMinutes: number;
  marksPerQuestion: string;
  negativeMarks: string;
  isFree: boolean;
  price: string;
  testQuestions?: TestQuestionRow[];
}

export interface TestQuestionRow {
  id: string;
  order: number;
  question: QuestionFull;
}

export type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface QuestionFull {
  id: string;
  subjectId?: string | null;
  topicId?: string | null;
  type: QuestionType;
  difficulty: Difficulty;
  marks: string;
  negativeMarks: string;
  translations: { language: Language; text: string; explanation?: string | null }[];
  options: {
    id: string;
    order: number;
    isCorrect: boolean;
    translations: { language: Language; text: string }[];
  }[];
}

export interface Batch {
  id: string;
  titleEn: string;
  titleHi?: string | null;
  descriptionEn?: string | null;
  descriptionHi?: string | null;
  isFree: boolean;
  price: string;
  isPublished: boolean;
}

export interface NoteVolume {
  id: string;
  courseId?: string | null;
  titleEn: string;
  titleHi?: string | null;
  isFree: boolean;
  price: string;
  notes?: NoteRow[];
}

export interface NoteRow {
  id: string;
  noteVolumeId: string;
  titleEn: string;
  titleHi?: string | null;
  fileUrl: string;
  isFree: boolean;
}

export interface VideoRow {
  id: string;
  courseId?: string | null;
  batchId?: string | null;
  titleEn: string;
  titleHi?: string | null;
  videoUrl: string;
  isFree: boolean;
}

export interface BlogCategory {
  id: string;
  nameEn: string;
  nameHi?: string | null;
}

export interface BlogRow {
  id: string;
  slug: string;
  coverImageUrl?: string | null;
  categoryId?: string | null;
  isPublished: boolean;
  translations: { language: Language; title: string; excerpt?: string | null; content: string }[];
}

export interface CurrentAffairCategory {
  id: string;
  nameEn: string;
  nameHi?: string | null;
}

export interface CurrentAffairRow {
  id: string;
  date: string;
  categoryId?: string | null;
  isPublished: boolean;
  translations: { language: Language; title: string; content: string }[];
}

export type CouponType = 'PERCENT' | 'FIXED';

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: string;
  maxDiscount?: string | null;
  minPurchase?: string | null;
  usageLimit?: number | null;
  perUserLimit: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
}

export interface Payment {
  id: string;
  userId: string;
  user?: { id: string; name: string; email: string };
  razorpayOrderId: string;
  amount: string;
  currency: string;
  status: 'CREATED' | 'PAID' | 'FAILED' | 'REFUNDED';
  itemType: string;
  itemId: string;
  createdAt: string;
}

export interface CoinTransaction {
  id: string;
  userId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  reason: string;
  createdAt: string;
}

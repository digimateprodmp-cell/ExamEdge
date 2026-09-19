export type Role = 'STUDENT' | 'ADMIN';
export type Language = 'EN' | 'HI';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  state?: string | null;
  avatarUrl?: string | null;
  coinBalance: number;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  referralCode: string;
  createdAt?: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Course {
  id: string;
  titleEn: string;
  titleHi?: string | null;
  descriptionEn?: string | null;
  descriptionHi?: string | null;
  thumbnailUrl?: string | null;
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
  thumbnailUrl?: string | null;
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
  startAt?: string | null;
  endAt?: string | null;
  _count?: { testQuestions: number };
}

export interface AttemptQuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface AttemptQuestion {
  testQuestionId: string;
  questionId: string;
  order: number;
  marks: string;
  negativeMarks: string;
  text: string;
  explanation: string | null;
  options: AttemptQuestionOption[];
  selectedOptionId: string | null;
  isMarkedForReview: boolean;
}

export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_SUBMITTED';

export interface Attempt {
  id: string;
  testId: string;
  status: AttemptStatus;
  language: Language;
  startedAt: string;
  expiresAt: string;
  submittedAt: string | null;
  durationMinutes: number;
  title: string;
  score: string | null;
  correctCount: number | null;
  incorrectCount: number | null;
  unattemptedCount: number | null;
  timeTakenSeconds: number | null;
  questions: AttemptQuestion[];
}

export interface AttemptSummary {
  id: string;
  testId: string;
  status: AttemptStatus;
  score: string | null;
  correctCount: number | null;
  incorrectCount: number | null;
  unattemptedCount: number | null;
  timeTakenSeconds: number | null;
  submittedAt: string | null;
  createdAt: string;
  test: { titleEn: string; titleHi?: string | null; type: TestType };
}

export interface NoteVolume {
  id: string;
  courseId?: string | null;
  titleEn: string;
  titleHi?: string | null;
  isFree: boolean;
  price: string;
  notes?: Note[];
}

export interface Note {
  id: string;
  noteVolumeId: string;
  titleEn: string;
  titleHi?: string | null;
  fileUrl: string | null;
  isFree: boolean;
}

export interface Video {
  id: string;
  courseId?: string | null;
  batchId?: string | null;
  titleEn: string;
  titleHi?: string | null;
  isFree: boolean;
  durationSeconds?: number | null;
}

export interface BlogCategory {
  id: string;
  nameEn: string;
  nameHi?: string | null;
}

export interface Blog {
  id: string;
  slug: string;
  coverImageUrl?: string | null;
  category?: BlogCategory | null;
  isPublished: boolean;
  publishedAt?: string | null;
  title: string;
  excerpt?: string | null;
  content: string;
}

export interface CurrentAffairCategory {
  id: string;
  nameEn: string;
  nameHi?: string | null;
}

export interface CurrentAffair {
  id: string;
  date: string;
  category?: CurrentAffairCategory | null;
  isPublished: boolean;
  title: string;
  content: string;
}

export interface Batch {
  id: string;
  titleEn: string;
  titleHi?: string | null;
  descriptionEn?: string | null;
  descriptionHi?: string | null;
  thumbnailUrl?: string | null;
  isFree: boolean;
  price: string;
  isPublished: boolean;
  videos?: { id: string; titleEn: string; titleHi?: string | null }[];
}

export type CoinTxnType = 'CREDIT' | 'DEBIT';

export interface CoinTransaction {
  id: string;
  userId: string;
  type: CoinTxnType;
  amount: number;
  reason: string;
  createdAt: string;
}

export type CouponType = 'PERCENT' | 'FIXED';

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: string;
  maxDiscount?: string | null;
  minPurchase?: string | null;
  validFrom: string;
  validTo: string;
  isActive: boolean;
}

export interface CouponUsage {
  id: string;
  couponId: string;
  discountApplied: string;
  usedAt: string;
  coupon: Coupon;
}

export type PaymentItemType = 'COURSE' | 'TEST_SERIES' | 'BATCH' | 'NOTE_VOLUME' | 'SLOT_BOOKING';
export type PaymentStatusValue = 'CREATED' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface Payment {
  id: string;
  razorpayOrderId: string;
  amount: string;
  currency: string;
  status: PaymentStatusValue;
  itemType: PaymentItemType;
  itemId: string;
  createdAt: string;
}

// ============================================================
// Exam layer / Live Test / slots / subscriptions / notifications
// ============================================================

export interface Exam {
  id: string;
  nameEn: string;
  nameHi?: string | null;
  slug: string;
  category: string;
  cycles?: ExamCycle[];
}

export interface ExamCycle {
  id: string;
  examId: string;
  year: number;
  courseId?: string | null;
  exam?: Exam;
}

export interface StudentExamProfile {
  id: string;
  userId: string;
  examCycleId: string;
  targetYear?: number | null;
  prepStatus: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  preferredLanguage: Language;
  isPrimary: boolean;
  isActive: boolean;
  examCycle: ExamCycle;
}

export type LiveTestStatusValue =
  | 'UPCOMING'
  | 'COUNTDOWN'
  | 'LIVE'
  | 'ENDED'
  | 'CANCELLED'
  | 'RESULTS_AVAILABLE';

export interface LiveTest {
  id: string;
  title: string;
  examCycleId?: string | null;
  testId: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  timezone: string;
  allowLateEntry: boolean;
  lateEntryCutoffAt?: string | null;
  isFree: boolean;
  price: string;
  status: LiveTestStatusValue;
  instructions?: string | null;
  resultVisibility: 'IMMEDIATE' | 'MANUAL' | 'SCHEDULED';
  test?: { titleEn: string; titleHi?: string | null; durationMinutes: number };
}

export type LiveAttemptStatusValue =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'AUTO_SUBMITTED'
  | 'TERMINATED_FOR_VIOLATION';

export interface IntegrityPolicyConfig {
  blockedShortcuts?: string[];
  blockCopy?: boolean;
  blockPaste?: boolean;
  blockPrint?: boolean;
  blockDevTools?: boolean;
  blockTextSelection?: boolean;
}

export interface LiveTestAttemptState {
  liveTestAttemptId: string;
  liveTestId: string;
  status: LiveAttemptStatusValue;
  integrityWarningCount: number;
  joinedAt: string;
  integrityPolicyConfig: IntegrityPolicyConfig | null;
  attempt: Attempt;
}

export interface IntegrityEventResult {
  action: 'LOGGED' | 'WARNING' | 'TERMINATED';
  warningCount: number;
  terminated?: boolean;
  alreadyTerminated?: boolean;
}

export interface TestSlot {
  id: string;
  liveTestId: string;
  startAt: string;
  endAt: string;
  timezone: string;
  capacity: number;
  bookedCount: number;
  status: 'OPEN' | 'FULL' | 'CLOSED' | 'CANCELLED';
}

export interface SlotBooking {
  id: string;
  slotId: string;
  status: 'CONFIRMED' | 'CANCELLED';
  slot: TestSlot & { liveTest: { title: string; testId: string } };
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string | null;
  priceMonthly: string;
  priceYearly: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string | null;
  readAt?: string | null;
  createdAt: string;
}

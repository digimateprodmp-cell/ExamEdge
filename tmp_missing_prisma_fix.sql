ALTER TABLE blogs
  ADD COLUMN IF NOT EXISTS id VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS slug VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS coverImageUrl VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS authorId VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS categoryId VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS isPublished BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS publishedAt DATETIME NULL,
  ADD COLUMN IF NOT EXISTS deletedAt DATETIME NULL,
  ADD COLUMN IF NOT EXISTS updatedAt DATETIME NULL;

UPDATE blogs
SET id = COALESCE(id, CONCAT('blog_', blogId)),
    slug = COALESCE(slug, LOWER(REPLACE(REPLACE(REPLACE(blogTitle, ' ', '-'), '/', '-'), '&', ''))),
    coverImageUrl = COALESCE(coverImageUrl, blogThumbnail),
    authorId = COALESCE(authorId, CONCAT('user_', blogCreatedBy)),
    categoryId = COALESCE(categoryId, CONCAT('blogcat_', cId)),
    isPublished = COALESCE(isPublished, blogStatus),
    publishedAt = COALESCE(publishedAt, created_at),
    updatedAt = COALESCE(updatedAt, updated_at)
WHERE id IS NULL OR slug IS NULL OR coverImageUrl IS NULL OR authorId IS NULL OR categoryId IS NULL OR updatedAt IS NULL;

ALTER TABLE blogs
  MODIFY id VARCHAR(191) NOT NULL,
  MODIFY slug VARCHAR(191) NOT NULL,
  MODIFY updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE blogs
  ADD UNIQUE INDEX blogs_id_key (id),
  ADD UNIQUE INDEX blogs_slug_key (slug);

CREATE TABLE IF NOT EXISTS subjects (
  id VARCHAR(191) NOT NULL,
  nameEn VARCHAR(191) NOT NULL,
  nameHi VARCHAR(191) NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL,
  PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS topics (
  id VARCHAR(191) NOT NULL,
  subjectId VARCHAR(191) NOT NULL,
  nameEn VARCHAR(191) NOT NULL,
  nameHi VARCHAR(191) NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL,
  INDEX topics_subjectId_idx (subjectId),
  PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS test_series (
  id VARCHAR(191) NOT NULL,
  courseId VARCHAR(191) NULL,
  titleEn VARCHAR(191) NOT NULL,
  titleHi VARCHAR(191) NULL,
  descriptionEn TEXT NULL,
  descriptionHi TEXT NULL,
  thumbnailUrl VARCHAR(191) NULL,
  validityDays INTEGER NOT NULL DEFAULT 365,
  isFree BOOLEAN NOT NULL DEFAULT false,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  isPublished BOOLEAN NOT NULL DEFAULT false,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL,
  deletedAt DATETIME(3) NULL,
  INDEX test_series_courseId_idx (courseId),
  PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS test_volumes (
  id VARCHAR(191) NOT NULL,
  testSeriesId VARCHAR(191) NOT NULL,
  titleEn VARCHAR(191) NOT NULL,
  titleHi VARCHAR(191) NULL,
  `order` INTEGER NOT NULL DEFAULT 0,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL,
  INDEX test_volumes_testSeriesId_idx (testSeriesId),
  PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS blog_categories (
  id VARCHAR(191) NOT NULL,
  nameEn VARCHAR(191) NOT NULL,
  nameHi VARCHAR(191) NULL,
  PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS blog_translations (
  id VARCHAR(191) NOT NULL,
  blogId VARCHAR(191) NOT NULL,
  language ENUM('EN', 'HI') NOT NULL,
  title VARCHAR(191) NOT NULL,
  excerpt TEXT NULL,
  content TEXT NOT NULL,
  UNIQUE INDEX blog_translations_blogId_language_key (blogId, language),
  PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS current_affair_categories (
  id VARCHAR(191) NOT NULL,
  nameEn VARCHAR(191) NOT NULL,
  nameHi VARCHAR(191) NULL,
  PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS current_affairs (
  id VARCHAR(191) NOT NULL,
  date DATETIME(3) NOT NULL,
  categoryId VARCHAR(191) NULL,
  isPublished BOOLEAN NOT NULL DEFAULT false,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL,
  INDEX current_affairs_categoryId_idx (categoryId),
  INDEX current_affairs_date_idx (date),
  PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS current_affair_translations (
  id VARCHAR(191) NOT NULL,
  currentAffairId VARCHAR(191) NOT NULL,
  language ENUM('EN', 'HI') NOT NULL,
  title VARCHAR(191) NOT NULL,
  content TEXT NOT NULL,
  UNIQUE INDEX current_affair_translations_currentAffairId_language_key (currentAffairId, language),
  PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS coin_transactions (
  id VARCHAR(191) NOT NULL,
  userId VARCHAR(191) NOT NULL,
  type ENUM('CREDIT', 'DEBIT') NOT NULL,
  amount INTEGER NOT NULL,
  reason VARCHAR(191) NOT NULL,
  refType VARCHAR(191) NULL,
  refId VARCHAR(191) NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX coin_transactions_userId_idx (userId),
  PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(191) NOT NULL,
  userId VARCHAR(191) NOT NULL,
  razorpayOrderId VARCHAR(191) NOT NULL,
  razorpayPaymentId VARCHAR(191) NULL,
  razorpaySignature VARCHAR(191) NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(191) NOT NULL DEFAULT 'INR',
  status ENUM('CREATED', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'CREATED',
  itemType ENUM('COURSE', 'TEST_SERIES', 'BATCH', 'NOTE_VOLUME') NOT NULL,
  itemId VARCHAR(191) NOT NULL,
  couponId VARCHAR(191) NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL,
  UNIQUE INDEX payments_razorpayOrderId_key (razorpayOrderId),
  INDEX payments_userId_idx (userId),
  PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS coupon_usages (
  id VARCHAR(191) NOT NULL,
  couponId VARCHAR(191) NOT NULL,
  userId VARCHAR(191) NOT NULL,
  paymentId VARCHAR(191) NULL,
  discountApplied DECIMAL(10, 2) NOT NULL,
  usedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX coupon_usages_paymentId_key (paymentId),
  INDEX coupon_usages_couponId_idx (couponId),
  INDEX coupon_usages_userId_idx (userId),
  PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS enrollments (
  id VARCHAR(191) NOT NULL,
  userId VARCHAR(191) NOT NULL,
  courseId VARCHAR(191) NULL,
  testSeriesId VARCHAR(191) NULL,
  batchId VARCHAR(191) NULL,
  noteVolumeId VARCHAR(191) NULL,
  source ENUM('PURCHASE', 'COIN', 'COUPON', 'ADMIN') NOT NULL,
  enrolledAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  expiresAt DATETIME(3) NULL,
  INDEX enrollments_userId_idx (userId),
  INDEX enrollments_courseId_idx (courseId),
  INDEX enrollments_testSeriesId_idx (testSeriesId),
  INDEX enrollments_batchId_idx (batchId),
  PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS question_translations (
  id VARCHAR(191) NOT NULL,
  questionId VARCHAR(191) NOT NULL,
  language ENUM('EN', 'HI') NOT NULL,
  text TEXT NOT NULL,
  explanation TEXT NULL,
  UNIQUE INDEX question_translations_questionId_language_key (questionId, language),
  PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS note_volumes (
  id VARCHAR(191) NOT NULL,
  courseId VARCHAR(191) NULL,
  titleEn VARCHAR(191) NOT NULL,
  titleHi VARCHAR(191) NULL,
  isFree BOOLEAN NOT NULL DEFAULT false,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL,
  INDEX note_volumes_courseId_idx (courseId),
  PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS videos (
  id VARCHAR(191) NOT NULL,
  courseId VARCHAR(191) NULL,
  batchId VARCHAR(191) NULL,
  titleEn VARCHAR(191) NOT NULL,
  titleHi VARCHAR(191) NULL,
  videoUrl VARCHAR(191) NOT NULL,
  isFree BOOLEAN NOT NULL DEFAULT false,
  durationSeconds INTEGER NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL,
  INDEX videos_courseId_idx (courseId),
  INDEX videos_batchId_idx (batchId),
  PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

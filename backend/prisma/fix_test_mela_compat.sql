ALTER TABLE `blogs`
  ADD COLUMN IF NOT EXISTS id VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS slug VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS coverImageUrl VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS authorId VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS categoryId VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS isPublished BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS publishedAt DATETIME NULL,
  ADD COLUMN IF NOT EXISTS deletedAt DATETIME NULL,
  ADD COLUMN IF NOT EXISTS updatedAt DATETIME NULL;

UPDATE `blogs`
SET
  id = COALESCE(id, CONCAT('blog_', blogId)),
  slug = COALESCE(slug, LOWER(REPLACE(REPLACE(REPLACE(blogTitle, ' ', '-'), '/', '-'), '&', ''))),
  coverImageUrl = COALESCE(coverImageUrl, blogThumbnail),
  authorId = COALESCE(authorId, CONCAT('user_', blogCreatedBy)),
  categoryId = COALESCE(categoryId, CONCAT('blogcat_', cId)),
  isPublished = COALESCE(isPublished, blogStatus),
  publishedAt = COALESCE(publishedAt, created_at),
  updatedAt = COALESCE(updatedAt, updated_at)
WHERE id IS NULL OR slug IS NULL OR coverImageUrl IS NULL OR authorId IS NULL OR categoryId IS NULL OR updatedAt IS NULL;

ALTER TABLE `blogs`
  MODIFY id VARCHAR(191) NOT NULL,
  MODIFY slug VARCHAR(191) NOT NULL,
  MODIFY updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE `blogs`
  ADD UNIQUE INDEX IF NOT EXISTS blogs_id_key (id),
  ADD UNIQUE INDEX IF NOT EXISTS blogs_slug_key (slug);

ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `phone` VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS `passwordHash` VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS `role` ENUM('STUDENT', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
  ADD COLUMN IF NOT EXISTS `state` VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS `avatarUrl` VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS `referralCode` VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS `referredById` VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS `coinBalance` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `isEmailVerified` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS `isPhoneVerified` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS `isActive` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS `createdAt` DATETIME(3) NULL,
  ADD COLUMN IF NOT EXISTS `updatedAt` DATETIME(3) NULL,
  ADD COLUMN IF NOT EXISTS `deletedAt` DATETIME(3) NULL;

SET @user_blog_fk_exists = (
  SELECT COUNT(*)
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'blogs'
    AND CONSTRAINT_NAME = 'blogcreater'
);
SET @drop_user_blog_fk = IF(
  @user_blog_fk_exists > 0,
  'ALTER TABLE `blogs` DROP FOREIGN KEY `blogcreater`',
  'SELECT 1'
);
PREPARE drop_user_blog_fk_stmt FROM @drop_user_blog_fk;
EXECUTE drop_user_blog_fk_stmt;
DEALLOCATE PREPARE drop_user_blog_fk_stmt;

ALTER TABLE `blogs` MODIFY `blogCreatedBy` VARCHAR(191) NOT NULL;
ALTER TABLE `users` MODIFY `id` VARCHAR(191) NOT NULL;

UPDATE `users`
SET
  phone = NULLIF(contact, ''),
  passwordHash = COALESCE(passwordHash, password),
  role = CASE WHEN type IN ('Admin', 'ADMIN', 'admin') OR isSubAdmin = 1 THEN 'ADMIN' ELSE 'STUDENT' END,
  avatarUrl = NULLIF(image, ''),
  referralCode = COALESCE(referralCode, CONCAT('legacy_', id)),
  isEmailVerified = COALESCE(email_verified, 0),
  isPhoneVerified = COALESCE(phoneVerified, 0),
  isActive = COALESCE(status, 1),
  createdAt = COALESCE(createdAt, created_at, CURRENT_TIMESTAMP(3)),
  updatedAt = COALESCE(updatedAt, updated_at, created_at, CURRENT_TIMESTAMP(3))
WHERE passwordHash IS NULL OR referralCode IS NULL OR createdAt IS NULL OR updatedAt IS NULL;

ALTER TABLE `users`
  MODIFY `passwordHash` VARCHAR(191) NOT NULL,
  MODIFY `referralCode` VARCHAR(191) NOT NULL,
  MODIFY `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

ALTER TABLE `users`
  ADD UNIQUE INDEX IF NOT EXISTS users_referralCode_key (`referralCode`);

CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `tokenHash` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `revokedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `refresh_tokens_userId_idx` (`userId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `verification_tokens` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `purpose` ENUM('EMAIL_VERIFY', 'PHONE_VERIFY', 'PASSWORD_RESET') NOT NULL,
  `codeHash` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `consumedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `verification_tokens_userId_purpose_idx` (`userId`, `purpose`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `test_attempts` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `testId` VARCHAR(191) NOT NULL,
  `language` ENUM('EN', 'HI') NOT NULL DEFAULT 'EN',
  `status` ENUM('IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED') NOT NULL DEFAULT 'IN_PROGRESS',
  `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expiresAt` DATETIME(3) NOT NULL,
  `submittedAt` DATETIME(3) NULL,
  `score` DECIMAL(8, 2) NULL,
  `correctCount` INTEGER NULL,
  `incorrectCount` INTEGER NULL,
  `unattemptedCount` INTEGER NULL,
  `timeTakenSeconds` INTEGER NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `test_attempts_userId_testId_idx` (`userId`, `testId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `test_answers` (
  `id` VARCHAR(191) NOT NULL,
  `attemptId` VARCHAR(191) NOT NULL,
  `testQuestionId` VARCHAR(191) NOT NULL,
  `selectedOptionId` VARCHAR(191) NULL,
  `isMarkedForReview` BOOLEAN NOT NULL DEFAULT false,
  `isCorrect` BOOLEAN NULL,
  `marksAwarded` DECIMAL(6, 2) NULL,
  `answeredAt` DATETIME(3) NULL,
  INDEX `test_answers_attemptId_idx` (`attemptId`),
  UNIQUE INDEX `test_answers_attemptId_testQuestionId_key` (`attemptId`, `testQuestionId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `subjects` (
  `id` VARCHAR(191) NOT NULL,
  `nameEn` VARCHAR(191) NOT NULL,
  `nameHi` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `topics` (
  `id` VARCHAR(191) NOT NULL,
  `subjectId` VARCHAR(191) NOT NULL,
  `nameEn` VARCHAR(191) NOT NULL,
  `nameHi` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `topics_subjectId_idx` (`subjectId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `test_series` (
  `id` VARCHAR(191) NOT NULL,
  `courseId` VARCHAR(191) NULL,
  `titleEn` VARCHAR(191) NOT NULL,
  `titleHi` VARCHAR(191) NULL,
  `descriptionEn` TEXT NULL,
  `descriptionHi` TEXT NULL,
  `thumbnailUrl` VARCHAR(191) NULL,
  `validityDays` INTEGER NOT NULL DEFAULT 365,
  `isFree` BOOLEAN NOT NULL DEFAULT false,
  `price` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  `isPublished` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `deletedAt` DATETIME(3) NULL,
  INDEX `test_series_courseId_idx` (`courseId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `test_volumes` (
  `id` VARCHAR(191) NOT NULL,
  `testSeriesId` VARCHAR(191) NOT NULL,
  `titleEn` VARCHAR(191) NOT NULL,
  `titleHi` VARCHAR(191) NULL,
  `order` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `test_volumes_testSeriesId_idx` (`testSeriesId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `test_volumes`
  ADD COLUMN IF NOT EXISTS `testSeriesId` VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS `titleEn` VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS `titleHi` VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS `order` INTEGER NULL,
  ADD COLUMN IF NOT EXISTS `createdAt` DATETIME(3) NULL,
  ADD COLUMN IF NOT EXISTS `updatedAt` DATETIME(3) NULL;

UPDATE `test_volumes`
SET
  `testSeriesId` = COALESCE(NULLIF(`testSeriesId`, ''), CONCAT('legacy_test_series_', `id`)),
  `titleEn` = COALESCE(NULLIF(`titleEn`, ''), NULLIF(`titleHi`, ''), CONCAT('Volume ', `id`)),
  `order` = CASE WHEN `order` IS NULL OR `order` = '' THEN 0 ELSE `order` END,
  `createdAt` = COALESCE(`createdAt`, CURRENT_TIMESTAMP(3)),
  `updatedAt` = COALESCE(`updatedAt`, `createdAt`, CURRENT_TIMESTAMP(3));

ALTER TABLE `test_volumes`
  MODIFY `id` VARCHAR(191) NOT NULL,
  MODIFY `testSeriesId` VARCHAR(191) NOT NULL,
  MODIFY `titleEn` VARCHAR(191) NOT NULL,
  MODIFY `order` INTEGER NOT NULL DEFAULT 0,
  MODIFY `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD INDEX IF NOT EXISTS `test_volumes_testSeriesId_idx` (`testSeriesId`);

CREATE TABLE IF NOT EXISTS `tests` (
  `id` VARCHAR(191) NOT NULL,
  `testVolumeId` VARCHAR(191) NOT NULL,
  `titleEn` VARCHAR(191) NOT NULL,
  `titleHi` VARCHAR(191) NULL,
  `instructionsEn` TEXT NULL,
  `instructionsHi` TEXT NULL,
  `type` ENUM('LIVE', 'PRACTICE', 'PDF') NOT NULL DEFAULT 'PRACTICE',
  `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `durationMinutes` INTEGER NOT NULL DEFAULT 60,
  `marksPerQuestion` DECIMAL(6, 2) NOT NULL DEFAULT 1,
  `negativeMarks` DECIMAL(6, 2) NOT NULL DEFAULT 0,
  `isFree` BOOLEAN NOT NULL DEFAULT false,
  `price` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  `startAt` DATETIME(3) NULL,
  `endAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `deletedAt` DATETIME(3) NULL,
  INDEX `tests_testVolumeId_idx` (`testVolumeId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `tests`
  ADD COLUMN IF NOT EXISTS `id` VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS `testVolumeId` VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS `titleEn` VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS `titleHi` VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS `instructionsEn` TEXT NULL,
  ADD COLUMN IF NOT EXISTS `instructionsHi` TEXT NULL,
  ADD COLUMN IF NOT EXISTS `type` ENUM('LIVE', 'PRACTICE', 'PDF') NOT NULL DEFAULT 'PRACTICE',
  ADD COLUMN IF NOT EXISTS `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS `durationMinutes` INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS `marksPerQuestion` DECIMAL(6, 2) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS `negativeMarks` DECIMAL(6, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `isFree` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS `price` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `startAt` DATETIME(3) NULL,
  ADD COLUMN IF NOT EXISTS `endAt` DATETIME(3) NULL,
  ADD COLUMN IF NOT EXISTS `createdAt` DATETIME(3) NULL,
  ADD COLUMN IF NOT EXISTS `updatedAt` DATETIME(3) NULL,
  ADD COLUMN IF NOT EXISTS `deletedAt` DATETIME(3) NULL;

SET @legacy_test_id_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'tests'
    AND COLUMN_NAME = 'tId'
);
SET @update_legacy_tests_sql = IF(
  @legacy_test_id_exists > 0,
  'UPDATE `tests` SET `id` = COALESCE(`id`, CONCAT(''legacy_test_'', `tId`)), `testVolumeId` = COALESCE(`testVolumeId`, CONCAT(''legacy_volume_'', COALESCE(`tsId`, `tId`))), `titleEn` = COALESCE(`titleEn`, `tName`), `instructionsEn` = COALESCE(`instructionsEn`, `description`), `durationMinutes` = COALESCE(`durationMinutes`, `duration`, 60), `marksPerQuestion` = CASE WHEN `total_questions` IS NOT NULL AND `total_questions` > 0 AND `total_marks` IS NOT NULL THEN `total_marks` / `total_questions` ELSE 1 END, `price` = COALESCE(`price`, `cost`, 0), `isFree` = CASE WHEN COALESCE(`cost`, 0) = 0 THEN true ELSE false END, `status` = CASE WHEN `tStatus` = 1 THEN ''PUBLISHED'' ELSE ''DRAFT'' END, `startAt` = COALESCE(`startAt`, `start_date`), `endAt` = COALESCE(`endAt`, `end_date`), `createdAt` = COALESCE(`createdAt`, `created_at`, CURRENT_TIMESTAMP(3)), `updatedAt` = COALESCE(`updatedAt`, `updated_at`, `created_at`, CURRENT_TIMESTAMP(3)) WHERE `id` IS NULL OR `testVolumeId` IS NULL OR `titleEn` IS NULL OR `createdAt` IS NULL OR `updatedAt` IS NULL',
  'SELECT 1'
);
PREPARE update_legacy_tests_stmt FROM @update_legacy_tests_sql;
EXECUTE update_legacy_tests_stmt;
DEALLOCATE PREPARE update_legacy_tests_stmt;

ALTER TABLE `tests`
  MODIFY `id` VARCHAR(191) NOT NULL,
  MODIFY `testVolumeId` VARCHAR(191) NOT NULL,
  MODIFY `titleEn` VARCHAR(191) NOT NULL,
  MODIFY `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

ALTER TABLE `tests`
  ADD UNIQUE INDEX IF NOT EXISTS `tests_id_key` (`id`),
  ADD INDEX IF NOT EXISTS `tests_testVolumeId_idx` (`testVolumeId`);

ALTER TABLE `questions`
  ADD COLUMN IF NOT EXISTS `id` VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS `subjectId` VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS `topicId` VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS `type` ENUM('SINGLE_CHOICE', 'MULTIPLE_CHOICE') NOT NULL DEFAULT 'SINGLE_CHOICE',
  ADD COLUMN IF NOT EXISTS `difficulty` ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL DEFAULT 'MEDIUM',
  ADD COLUMN IF NOT EXISTS `negativeMarks` DECIMAL(6, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `createdById` VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS `createdAt` DATETIME(3) NULL,
  ADD COLUMN IF NOT EXISTS `updatedAt` DATETIME(3) NULL,
  ADD COLUMN IF NOT EXISTS `deletedAt` DATETIME(3) NULL;

UPDATE `questions`
SET
  id = COALESCE(id, CONCAT('legacy_question_', qId)),
  type = CASE WHEN LOWER(qType) IN ('checkbox', 'multiple', 'multiple_choice') THEN 'MULTIPLE_CHOICE' ELSE 'SINGLE_CHOICE' END,
  difficulty = 'MEDIUM',
  negativeMarks = COALESCE(negativeMarks, neg_marks, 0),
  createdById = COALESCE(createdById, CONCAT('user_', createdBy)),
  createdAt = COALESCE(createdAt, created_at, CURRENT_TIMESTAMP(3)),
  updatedAt = COALESCE(updatedAt, updated_at, created_at, CURRENT_TIMESTAMP(3))
WHERE id IS NULL OR createdAt IS NULL OR updatedAt IS NULL;

ALTER TABLE `questions`
  MODIFY `id` VARCHAR(191) NOT NULL,
  MODIFY `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

ALTER TABLE `questions`
  ADD UNIQUE INDEX IF NOT EXISTS `questions_id_key` (`id`);

CREATE TABLE IF NOT EXISTS `blog_categories` (
  `id` VARCHAR(191) NOT NULL,
  `nameEn` VARCHAR(191) NOT NULL,
  `nameHi` VARCHAR(191) NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `blog_translations` (
  `id` VARCHAR(191) NOT NULL,
  `blogId` VARCHAR(191) NOT NULL,
  `language` ENUM('EN', 'HI') NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `excerpt` TEXT NULL,
  `content` TEXT NOT NULL,
  UNIQUE INDEX `blog_translations_blogId_language_key` (`blogId`, `language`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `current_affair_categories` (
  `id` VARCHAR(191) NOT NULL,
  `nameEn` VARCHAR(191) NOT NULL,
  `nameHi` VARCHAR(191) NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `current_affairs` (
  `id` VARCHAR(191) NOT NULL,
  `date` DATETIME(3) NOT NULL,
  `categoryId` VARCHAR(191) NULL,
  `isPublished` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `current_affairs_categoryId_idx` (`categoryId`),
  INDEX `current_affairs_date_idx` (`date`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `current_affair_translations` (
  `id` VARCHAR(191) NOT NULL,
  `currentAffairId` VARCHAR(191) NOT NULL,
  `language` ENUM('EN', 'HI') NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `content` TEXT NOT NULL,
  UNIQUE INDEX `current_affair_translations_currentAffairId_language_key` (`currentAffairId`, `language`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `coin_transactions` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `type` ENUM('CREDIT', 'DEBIT') NOT NULL,
  `amount` INTEGER NOT NULL,
  `reason` VARCHAR(191) NOT NULL,
  `refType` VARCHAR(191) NULL,
  `refId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `coin_transactions_userId_idx` (`userId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payments` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `razorpayOrderId` VARCHAR(191) NOT NULL,
  `razorpayPaymentId` VARCHAR(191) NULL,
  `razorpaySignature` VARCHAR(191) NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
  `status` ENUM('CREATED', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'CREATED',
  `itemType` ENUM('COURSE', 'TEST_SERIES', 'BATCH', 'NOTE_VOLUME') NOT NULL,
  `itemId` VARCHAR(191) NOT NULL,
  `couponId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `payments_razorpayOrderId_key` (`razorpayOrderId`),
  INDEX `payments_userId_idx` (`userId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `coupon_usages` (
  `id` VARCHAR(191) NOT NULL,
  `couponId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `paymentId` VARCHAR(191) NULL,
  `discountApplied` DECIMAL(10, 2) NOT NULL,
  `usedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `coupon_usages_paymentId_key` (`paymentId`),
  INDEX `coupon_usages_couponId_idx` (`couponId`),
  INDEX `coupon_usages_userId_idx` (`userId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `enrollments` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `courseId` VARCHAR(191) NULL,
  `testSeriesId` VARCHAR(191) NULL,
  `batchId` VARCHAR(191) NULL,
  `noteVolumeId` VARCHAR(191) NULL,
  `source` ENUM('PURCHASE', 'COIN', 'COUPON', 'ADMIN') NOT NULL,
  `enrolledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expiresAt` DATETIME(3) NULL,
  INDEX `enrollments_userId_idx` (`userId`),
  INDEX `enrollments_courseId_idx` (`courseId`),
  INDEX `enrollments_testSeriesId_idx` (`testSeriesId`),
  INDEX `enrollments_batchId_idx` (`batchId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `question_translations` (
  `id` VARCHAR(191) NOT NULL,
  `questionId` VARCHAR(191) NOT NULL,
  `language` ENUM('EN', 'HI') NOT NULL,
  `text` TEXT NOT NULL,
  `explanation` TEXT NULL,
  UNIQUE INDEX `question_translations_questionId_language_key` (`questionId`, `language`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `question_translations` (`id`, `questionId`, `language`, `text`, `explanation`)
SELECT CONCAT('legacy_translation_', q.qId), q.id, 'EN', q.question, q.qHint
FROM `questions` q
LEFT JOIN `question_translations` qt
  ON CONVERT(qt.questionId USING utf8mb4) = CONVERT(q.id USING utf8mb4)
  AND qt.language = 'EN'
WHERE qt.id IS NULL;

CREATE OR REPLACE VIEW `test_questions` AS
SELECT
  CONCAT('legacy_test_question_', tsqId) AS id,
  CONCAT('legacy_test_', testId) AS testId,
  CONCAT('legacy_question_', qId) AS questionId,
  tsecId AS `order`
FROM `tsquestions`;

CREATE OR REPLACE VIEW `question_options` AS
SELECT CONCAT('legacy_option_', qId, '_1') AS id, CONCAT('legacy_question_', qId) AS questionId, 0 AS `order`, CASE WHEN CAST(correctAns AS CHAR) = '1' THEN 1 ELSE 0 END AS isCorrect FROM `questions`
UNION ALL SELECT CONCAT('legacy_option_', qId, '_2'), CONCAT('legacy_question_', qId), 1, CASE WHEN CAST(correctAns AS CHAR) = '2' THEN 1 ELSE 0 END FROM `questions`
UNION ALL SELECT CONCAT('legacy_option_', qId, '_3'), CONCAT('legacy_question_', qId), 2, CASE WHEN CAST(correctAns AS CHAR) = '3' THEN 1 ELSE 0 END FROM `questions`
UNION ALL SELECT CONCAT('legacy_option_', qId, '_4'), CONCAT('legacy_question_', qId), 3, CASE WHEN CAST(correctAns AS CHAR) = '4' THEN 1 ELSE 0 END FROM `questions`;

CREATE OR REPLACE VIEW `option_translations` AS
SELECT CONCAT('legacy_option_', qId, '_1_translation') AS id, CONCAT('legacy_option_', qId, '_1') AS optionId, 'EN' AS language, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(options, '$.option1')), '') AS text FROM `questions`
UNION ALL SELECT CONCAT('legacy_option_', qId, '_2_translation'), CONCAT('legacy_option_', qId, '_2'), 'EN', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(options, '$.option2')), '') FROM `questions`
UNION ALL SELECT CONCAT('legacy_option_', qId, '_3_translation'), CONCAT('legacy_option_', qId, '_3'), 'EN', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(options, '$.option3')), '') FROM `questions`
UNION ALL SELECT CONCAT('legacy_option_', qId, '_4_translation'), CONCAT('legacy_option_', qId, '_4'), 'EN', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(options, '$.option4')), '') FROM `questions`;

CREATE TABLE IF NOT EXISTS `note_volumes` (
  `id` VARCHAR(191) NOT NULL,
  `courseId` VARCHAR(191) NULL,
  `titleEn` VARCHAR(191) NOT NULL,
  `titleHi` VARCHAR(191) NULL,
  `isFree` BOOLEAN NOT NULL DEFAULT false,
  `price` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `note_volumes_courseId_idx` (`courseId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `videos` (
  `id` VARCHAR(191) NOT NULL,
  `courseId` VARCHAR(191) NULL,
  `batchId` VARCHAR(191) NULL,
  `titleEn` VARCHAR(191) NOT NULL,
  `titleHi` VARCHAR(191) NULL,
  `videoUrl` VARCHAR(191) NOT NULL,
  `isFree` BOOLEAN NOT NULL DEFAULT false,
  `durationSeconds` INTEGER NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `videos_courseId_idx` (`courseId`),
  INDEX `videos_batchId_idx` (`batchId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `tests` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `questions` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `tsquestions` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE OR REPLACE VIEW `test_questions` AS
SELECT
  (CONCAT(_utf8mb4'legacy_test_question_', tsqId) COLLATE utf8mb4_unicode_ci) AS id,
  (CONCAT(_utf8mb4'legacy_test_', testId) COLLATE utf8mb4_unicode_ci) AS testId,
  (CONCAT(_utf8mb4'legacy_question_', qId) COLLATE utf8mb4_unicode_ci) AS questionId,
  tsecId AS `order`
FROM `tsquestions`;

CREATE OR REPLACE VIEW `question_options` AS
SELECT (CONCAT(_utf8mb4'legacy_option_', qId, _utf8mb4'_1') COLLATE utf8mb4_unicode_ci) AS id, (CONCAT(_utf8mb4'legacy_question_', qId) COLLATE utf8mb4_unicode_ci) AS questionId, 0 AS `order`, CASE WHEN CAST(correctAns AS CHAR) = '1' THEN 1 ELSE 0 END AS isCorrect FROM `questions`
UNION ALL SELECT (CONCAT(_utf8mb4'legacy_option_', qId, _utf8mb4'_2') COLLATE utf8mb4_unicode_ci), (CONCAT(_utf8mb4'legacy_question_', qId) COLLATE utf8mb4_unicode_ci), 1, CASE WHEN CAST(correctAns AS CHAR) = '2' THEN 1 ELSE 0 END FROM `questions`
UNION ALL SELECT (CONCAT(_utf8mb4'legacy_option_', qId, _utf8mb4'_3') COLLATE utf8mb4_unicode_ci), (CONCAT(_utf8mb4'legacy_question_', qId) COLLATE utf8mb4_unicode_ci), 2, CASE WHEN CAST(correctAns AS CHAR) = '3' THEN 1 ELSE 0 END FROM `questions`
UNION ALL SELECT (CONCAT(_utf8mb4'legacy_option_', qId, _utf8mb4'_4') COLLATE utf8mb4_unicode_ci), (CONCAT(_utf8mb4'legacy_question_', qId) COLLATE utf8mb4_unicode_ci), 3, CASE WHEN CAST(correctAns AS CHAR) = '4' THEN 1 ELSE 0 END FROM `questions`;

CREATE OR REPLACE VIEW `option_translations` AS
SELECT (CONCAT(_utf8mb4'legacy_option_', qId, _utf8mb4'_1_translation') COLLATE utf8mb4_unicode_ci) AS id, (CONCAT(_utf8mb4'legacy_option_', qId, _utf8mb4'_1') COLLATE utf8mb4_unicode_ci) AS optionId, _utf8mb4'EN' COLLATE utf8mb4_unicode_ci AS language, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(options, '$.option1')), _utf8mb4'') COLLATE utf8mb4_unicode_ci AS text FROM `questions`
UNION ALL SELECT (CONCAT(_utf8mb4'legacy_option_', qId, _utf8mb4'_2_translation') COLLATE utf8mb4_unicode_ci), (CONCAT(_utf8mb4'legacy_option_', qId, _utf8mb4'_2') COLLATE utf8mb4_unicode_ci), _utf8mb4'EN' COLLATE utf8mb4_unicode_ci, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(options, '$.option2')), _utf8mb4'') COLLATE utf8mb4_unicode_ci FROM `questions`
UNION ALL SELECT (CONCAT(_utf8mb4'legacy_option_', qId, _utf8mb4'_3_translation') COLLATE utf8mb4_unicode_ci), (CONCAT(_utf8mb4'legacy_option_', qId, _utf8mb4'_3') COLLATE utf8mb4_unicode_ci), _utf8mb4'EN' COLLATE utf8mb4_unicode_ci, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(options, '$.option3')), _utf8mb4'') COLLATE utf8mb4_unicode_ci FROM `questions`
UNION ALL SELECT (CONCAT(_utf8mb4'legacy_option_', qId, _utf8mb4'_4_translation') COLLATE utf8mb4_unicode_ci), (CONCAT(_utf8mb4'legacy_option_', qId, _utf8mb4'_4') COLLATE utf8mb4_unicode_ci), _utf8mb4'EN' COLLATE utf8mb4_unicode_ci, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(options, '$.option4')), _utf8mb4'') COLLATE utf8mb4_unicode_ci FROM `questions`;

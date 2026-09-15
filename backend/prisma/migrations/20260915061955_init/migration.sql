-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('STUDENT', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
    `state` VARCHAR(191) NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `referralCode` VARCHAR(191) NOT NULL,
    `referredById` VARCHAR(191) NULL,
    `coinBalance` INTEGER NOT NULL DEFAULT 0,
    `isEmailVerified` BOOLEAN NOT NULL DEFAULT false,
    `isPhoneVerified` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_phone_key`(`phone`),
    UNIQUE INDEX `users_referralCode_key`(`referralCode`),
    INDEX `users_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `revokedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `refresh_tokens_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verification_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `purpose` ENUM('EMAIL_VERIFY', 'PHONE_VERIFY', 'PASSWORD_RESET') NOT NULL,
    `codeHash` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `consumedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `verification_tokens_userId_purpose_idx`(`userId`, `purpose`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subjects` (
    `id` VARCHAR(191) NOT NULL,
    `nameEn` VARCHAR(191) NOT NULL,
    `nameHi` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `topics` (
    `id` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NOT NULL,
    `nameEn` VARCHAR(191) NOT NULL,
    `nameHi` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `topics_subjectId_idx`(`subjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `courses` (
    `id` VARCHAR(191) NOT NULL,
    `titleEn` VARCHAR(191) NOT NULL,
    `titleHi` VARCHAR(191) NULL,
    `descriptionEn` TEXT NULL,
    `descriptionHi` TEXT NULL,
    `thumbnailUrl` VARCHAR(191) NULL,
    `isFree` BOOLEAN NOT NULL DEFAULT false,
    `price` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `test_series` (
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

    INDEX `test_series_courseId_idx`(`courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `test_volumes` (
    `id` VARCHAR(191) NOT NULL,
    `testSeriesId` VARCHAR(191) NOT NULL,
    `titleEn` VARCHAR(191) NOT NULL,
    `titleHi` VARCHAR(191) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `test_volumes_testSeriesId_idx`(`testSeriesId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `batches` (
    `id` VARCHAR(191) NOT NULL,
    `titleEn` VARCHAR(191) NOT NULL,
    `titleHi` VARCHAR(191) NULL,
    `descriptionEn` TEXT NULL,
    `descriptionHi` TEXT NULL,
    `thumbnailUrl` VARCHAR(191) NULL,
    `isFree` BOOLEAN NOT NULL DEFAULT false,
    `price` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `enrollments` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NULL,
    `testSeriesId` VARCHAR(191) NULL,
    `batchId` VARCHAR(191) NULL,
    `noteVolumeId` VARCHAR(191) NULL,
    `source` ENUM('PURCHASE', 'COIN', 'COUPON', 'ADMIN') NOT NULL,
    `enrolledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NULL,

    INDEX `enrollments_userId_idx`(`userId`),
    INDEX `enrollments_courseId_idx`(`courseId`),
    INDEX `enrollments_testSeriesId_idx`(`testSeriesId`),
    INDEX `enrollments_batchId_idx`(`batchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tests` (
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
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `tests_testVolumeId_idx`(`testVolumeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `questions` (
    `id` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NULL,
    `topicId` VARCHAR(191) NULL,
    `type` ENUM('SINGLE_CHOICE', 'MULTIPLE_CHOICE') NOT NULL DEFAULT 'SINGLE_CHOICE',
    `difficulty` ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL DEFAULT 'MEDIUM',
    `marks` DECIMAL(6, 2) NOT NULL DEFAULT 1,
    `negativeMarks` DECIMAL(6, 2) NOT NULL DEFAULT 0,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `questions_subjectId_idx`(`subjectId`),
    INDEX `questions_topicId_idx`(`topicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `question_translations` (
    `id` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `language` ENUM('EN', 'HI') NOT NULL,
    `text` TEXT NOT NULL,
    `explanation` TEXT NULL,

    UNIQUE INDEX `question_translations_questionId_language_key`(`questionId`, `language`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `question_options` (
    `id` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `isCorrect` BOOLEAN NOT NULL DEFAULT false,

    INDEX `question_options_questionId_idx`(`questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `option_translations` (
    `id` VARCHAR(191) NOT NULL,
    `optionId` VARCHAR(191) NOT NULL,
    `language` ENUM('EN', 'HI') NOT NULL,
    `text` TEXT NOT NULL,

    UNIQUE INDEX `option_translations_optionId_language_key`(`optionId`, `language`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `test_questions` (
    `id` VARCHAR(191) NOT NULL,
    `testId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,

    INDEX `test_questions_testId_idx`(`testId`),
    UNIQUE INDEX `test_questions_testId_questionId_key`(`testId`, `questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `test_attempts` (
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

    INDEX `test_attempts_userId_testId_idx`(`userId`, `testId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `test_answers` (
    `id` VARCHAR(191) NOT NULL,
    `attemptId` VARCHAR(191) NOT NULL,
    `testQuestionId` VARCHAR(191) NOT NULL,
    `selectedOptionId` VARCHAR(191) NULL,
    `isMarkedForReview` BOOLEAN NOT NULL DEFAULT false,
    `isCorrect` BOOLEAN NULL,
    `marksAwarded` DECIMAL(6, 2) NULL,
    `answeredAt` DATETIME(3) NULL,

    INDEX `test_answers_attemptId_idx`(`attemptId`),
    UNIQUE INDEX `test_answers_attemptId_testQuestionId_key`(`attemptId`, `testQuestionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `note_volumes` (
    `id` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NULL,
    `titleEn` VARCHAR(191) NOT NULL,
    `titleHi` VARCHAR(191) NULL,
    `isFree` BOOLEAN NOT NULL DEFAULT false,
    `price` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `note_volumes_courseId_idx`(`courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notes` (
    `id` VARCHAR(191) NOT NULL,
    `noteVolumeId` VARCHAR(191) NOT NULL,
    `titleEn` VARCHAR(191) NOT NULL,
    `titleHi` VARCHAR(191) NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `isFree` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `notes_noteVolumeId_idx`(`noteVolumeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `videos` (
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

    INDEX `videos_courseId_idx`(`courseId`),
    INDEX `videos_batchId_idx`(`batchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blog_categories` (
    `id` VARCHAR(191) NOT NULL,
    `nameEn` VARCHAR(191) NOT NULL,
    `nameHi` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blogs` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `coverImageUrl` VARCHAR(191) NULL,
    `authorId` VARCHAR(191) NULL,
    `categoryId` VARCHAR(191) NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `blogs_slug_key`(`slug`),
    INDEX `blogs_categoryId_idx`(`categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blog_translations` (
    `id` VARCHAR(191) NOT NULL,
    `blogId` VARCHAR(191) NOT NULL,
    `language` ENUM('EN', 'HI') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `excerpt` TEXT NULL,
    `content` TEXT NOT NULL,

    UNIQUE INDEX `blog_translations_blogId_language_key`(`blogId`, `language`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `current_affair_categories` (
    `id` VARCHAR(191) NOT NULL,
    `nameEn` VARCHAR(191) NOT NULL,
    `nameHi` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `current_affairs` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `categoryId` VARCHAR(191) NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `current_affairs_categoryId_idx`(`categoryId`),
    INDEX `current_affairs_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `current_affair_translations` (
    `id` VARCHAR(191) NOT NULL,
    `currentAffairId` VARCHAR(191) NOT NULL,
    `language` ENUM('EN', 'HI') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,

    UNIQUE INDEX `current_affair_translations_currentAffairId_language_key`(`currentAffairId`, `language`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coupons` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `type` ENUM('PERCENT', 'FIXED') NOT NULL,
    `value` DECIMAL(10, 2) NOT NULL,
    `maxDiscount` DECIMAL(10, 2) NULL,
    `minPurchase` DECIMAL(10, 2) NULL,
    `usageLimit` INTEGER NULL,
    `perUserLimit` INTEGER NOT NULL DEFAULT 1,
    `validFrom` DATETIME(3) NOT NULL,
    `validTo` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `applicableTo` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `coupons_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coupon_usages` (
    `id` VARCHAR(191) NOT NULL,
    `couponId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `paymentId` VARCHAR(191) NULL,
    `discountApplied` DECIMAL(10, 2) NOT NULL,
    `usedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `coupon_usages_paymentId_key`(`paymentId`),
    INDEX `coupon_usages_couponId_idx`(`couponId`),
    INDEX `coupon_usages_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coin_transactions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('CREDIT', 'DEBIT') NOT NULL,
    `amount` INTEGER NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `refType` VARCHAR(191) NULL,
    `refId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `coin_transactions_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
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

    UNIQUE INDEX `payments_razorpayOrderId_key`(`razorpayOrderId`),
    INDEX `payments_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_referredById_fkey` FOREIGN KEY (`referredById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `topics` ADD CONSTRAINT `topics_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `test_series` ADD CONSTRAINT `test_series_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `test_volumes` ADD CONSTRAINT `test_volumes_testSeriesId_fkey` FOREIGN KEY (`testSeriesId`) REFERENCES `test_series`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_testSeriesId_fkey` FOREIGN KEY (`testSeriesId`) REFERENCES `test_series`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `batches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_noteVolumeId_fkey` FOREIGN KEY (`noteVolumeId`) REFERENCES `note_volumes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tests` ADD CONSTRAINT `tests_testVolumeId_fkey` FOREIGN KEY (`testVolumeId`) REFERENCES `test_volumes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `topics`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question_translations` ADD CONSTRAINT `question_translations_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `questions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question_options` ADD CONSTRAINT `question_options_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `questions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `option_translations` ADD CONSTRAINT `option_translations_optionId_fkey` FOREIGN KEY (`optionId`) REFERENCES `question_options`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `test_questions` ADD CONSTRAINT `test_questions_testId_fkey` FOREIGN KEY (`testId`) REFERENCES `tests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `test_questions` ADD CONSTRAINT `test_questions_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `questions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `test_attempts` ADD CONSTRAINT `test_attempts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `test_attempts` ADD CONSTRAINT `test_attempts_testId_fkey` FOREIGN KEY (`testId`) REFERENCES `tests`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `test_answers` ADD CONSTRAINT `test_answers_attemptId_fkey` FOREIGN KEY (`attemptId`) REFERENCES `test_attempts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `test_answers` ADD CONSTRAINT `test_answers_testQuestionId_fkey` FOREIGN KEY (`testQuestionId`) REFERENCES `test_questions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `test_answers` ADD CONSTRAINT `test_answers_selectedOptionId_fkey` FOREIGN KEY (`selectedOptionId`) REFERENCES `question_options`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `note_volumes` ADD CONSTRAINT `note_volumes_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notes` ADD CONSTRAINT `notes_noteVolumeId_fkey` FOREIGN KEY (`noteVolumeId`) REFERENCES `note_volumes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `videos` ADD CONSTRAINT `videos_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `videos` ADD CONSTRAINT `videos_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `batches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blogs` ADD CONSTRAINT `blogs_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blogs` ADD CONSTRAINT `blogs_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `blog_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blog_translations` ADD CONSTRAINT `blog_translations_blogId_fkey` FOREIGN KEY (`blogId`) REFERENCES `blogs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `current_affairs` ADD CONSTRAINT `current_affairs_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `current_affair_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `current_affair_translations` ADD CONSTRAINT `current_affair_translations_currentAffairId_fkey` FOREIGN KEY (`currentAffairId`) REFERENCES `current_affairs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coupon_usages` ADD CONSTRAINT `coupon_usages_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `coupons`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coupon_usages` ADD CONSTRAINT `coupon_usages_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coupon_usages` ADD CONSTRAINT `coupon_usages_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `payments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coin_transactions` ADD CONSTRAINT `coin_transactions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `coupons`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

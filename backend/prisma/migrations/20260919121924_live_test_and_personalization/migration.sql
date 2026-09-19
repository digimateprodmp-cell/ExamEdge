-- AlterTable
ALTER TABLE `payments` MODIFY `itemType` ENUM('COURSE', 'TEST_SERIES', 'BATCH', 'NOTE_VOLUME', 'SLOT_BOOKING') NOT NULL;

-- CreateTable
CREATE TABLE `exams` (
    `id` VARCHAR(191) NOT NULL,
    `nameEn` VARCHAR(191) NOT NULL,
    `nameHi` VARCHAR(191) NULL,
    `slug` VARCHAR(191) NOT NULL,
    `category` ENUM('UPSC', 'SSC', 'BANKING', 'STATE_PSC', 'RAILWAY', 'DEFENCE', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `exams_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_cycles` (
    `id` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `courseId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `exam_cycles_examId_idx`(`examId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `syllabus_versions` (
    `id` VARCHAR(191) NOT NULL,
    `examCycleId` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `syllabus_versions_examCycleId_idx`(`examCycleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `syllabus_topics` (
    `id` VARCHAR(191) NOT NULL,
    `syllabusVersionId` VARCHAR(191) NOT NULL,
    `topicId` VARCHAR(191) NOT NULL,
    `weight` INTEGER NOT NULL DEFAULT 1,

    INDEX `syllabus_topics_topicId_idx`(`topicId`),
    UNIQUE INDEX `syllabus_topics_syllabusVersionId_topicId_key`(`syllabusVersionId`, `topicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_exam_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `examCycleId` VARCHAR(191) NOT NULL,
    `targetYear` INTEGER NULL,
    `prepStatus` ENUM('ACTIVE', 'PAUSED', 'COMPLETED') NOT NULL DEFAULT 'ACTIVE',
    `preferredLanguage` ENUM('EN', 'HI') NOT NULL DEFAULT 'EN',
    `preferredDifficulty` ENUM('EASY', 'MEDIUM', 'HARD') NULL,
    `targetExamDate` DATETIME(3) NULL,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastActivityAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `student_exam_profiles_userId_idx`(`userId`),
    UNIQUE INDEX `student_exam_profiles_userId_examCycleId_key`(`userId`, `examCycleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `integrity_policies` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `config` JSON NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `live_tests` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `examCycleId` VARCHAR(191) NULL,
    `testId` VARCHAR(191) NOT NULL,
    `startAt` DATETIME(3) NOT NULL,
    `endAt` DATETIME(3) NOT NULL,
    `durationMinutes` INTEGER NOT NULL,
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'Asia/Kolkata',
    `allowLateEntry` BOOLEAN NOT NULL DEFAULT false,
    `lateEntryCutoffAt` DATETIME(3) NULL,
    `status` ENUM('UPCOMING', 'COUNTDOWN', 'LIVE', 'ENDED', 'CANCELLED', 'RESULTS_AVAILABLE') NOT NULL DEFAULT 'UPCOMING',
    `instructions` TEXT NULL,
    `integrityPolicyId` VARCHAR(191) NULL,
    `resultVisibility` ENUM('IMMEDIATE', 'MANUAL', 'SCHEDULED') NOT NULL DEFAULT 'IMMEDIATE',
    `resultVisibleAt` DATETIME(3) NULL,
    `randomizeQuestions` BOOLEAN NOT NULL DEFAULT false,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `live_tests_examCycleId_idx`(`examCycleId`),
    INDEX `live_tests_testId_idx`(`testId`),
    INDEX `live_tests_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `live_test_attempts` (
    `id` VARCHAR(191) NOT NULL,
    `liveTestId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `testAttemptId` VARCHAR(191) NOT NULL,
    `status` ENUM('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED', 'TERMINATED_FOR_VIOLATION') NOT NULL DEFAULT 'NOT_STARTED',
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `integrityWarningCount` INTEGER NOT NULL DEFAULT 0,
    `assignedQuestionOrder` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `live_test_attempts_testAttemptId_key`(`testAttemptId`),
    INDEX `live_test_attempts_liveTestId_idx`(`liveTestId`),
    INDEX `live_test_attempts_userId_idx`(`userId`),
    UNIQUE INDEX `live_test_attempts_liveTestId_userId_key`(`liveTestId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_integrity_events` (
    `id` VARCHAR(191) NOT NULL,
    `liveTestAttemptId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `liveTestId` VARCHAR(191) NOT NULL,
    `eventType` ENUM('BLOCKED_SHORTCUT', 'COPY_ATTEMPT', 'PASTE_ATTEMPT', 'PRINT_ATTEMPT', 'DEVTOOLS_ATTEMPT', 'TAB_SWITCH', 'WINDOW_BLUR', 'FULLSCREEN_EXIT', 'CONNECTION_LOST', 'CONNECTION_RESTORED') NOT NULL,
    `keyCombination` VARCHAR(191) NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `browserInfo` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `severity` ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL DEFAULT 'LOW',
    `actionTaken` ENUM('LOGGED', 'WARNING', 'TERMINATED') NOT NULL DEFAULT 'LOGGED',

    INDEX `exam_integrity_events_liveTestAttemptId_idx`(`liveTestAttemptId`),
    INDEX `exam_integrity_events_liveTestId_idx`(`liveTestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `live_test_audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `liveTestId` VARCHAR(191) NULL,
    `actorId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `live_test_audit_logs_liveTestId_idx`(`liveTestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `test_slots` (
    `id` VARCHAR(191) NOT NULL,
    `liveTestId` VARCHAR(191) NOT NULL,
    `startAt` DATETIME(3) NOT NULL,
    `endAt` DATETIME(3) NOT NULL,
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'Asia/Kolkata',
    `capacity` INTEGER NOT NULL,
    `bookedCount` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('OPEN', 'FULL', 'CLOSED', 'CANCELLED') NOT NULL DEFAULT 'OPEN',
    `bookingOpenAt` DATETIME(3) NULL,
    `bookingCloseAt` DATETIME(3) NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `test_slots_liveTestId_idx`(`liveTestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `slot_reservations` (
    `id` VARCHAR(191) NOT NULL,
    `slotId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'EXPIRED', 'RELEASED') NOT NULL DEFAULT 'PENDING',
    `expiresAt` DATETIME(3) NOT NULL,
    `paymentId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `slot_reservations_paymentId_key`(`paymentId`),
    INDEX `slot_reservations_slotId_idx`(`slotId`),
    INDEX `slot_reservations_userId_idx`(`userId`),
    INDEX `slot_reservations_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `slot_bookings` (
    `id` VARCHAR(191) NOT NULL,
    `slotId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `reservationId` VARCHAR(191) NULL,
    `status` ENUM('CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'CONFIRMED',
    `paymentId` VARCHAR(191) NULL,
    `subscriptionId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `slot_bookings_reservationId_key`(`reservationId`),
    UNIQUE INDEX `slot_bookings_paymentId_key`(`paymentId`),
    INDEX `slot_bookings_slotId_idx`(`slotId`),
    INDEX `slot_bookings_userId_idx`(`userId`),
    UNIQUE INDEX `slot_bookings_slotId_userId_key`(`slotId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscription_plans` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `priceMonthly` DECIMAL(10, 2) NOT NULL,
    `priceYearly` DECIMAL(10, 2) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plan_entitlements` (
    `id` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NULL,
    `liveTestsLimit` INTEGER NULL,
    `practiceTestsLimit` INTEGER NULL,
    `aiQuestionsPerMonth` INTEGER NULL,

    INDEX `plan_entitlements_planId_idx`(`planId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscriptions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `startAt` DATETIME(3) NOT NULL,
    `endAt` DATETIME(3) NOT NULL,
    `status` ENUM('ACTIVE', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `subscriptions_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('PAYMENT', 'LIVE_TEST_SCHEDULE', 'LIVE_TEST_REMINDER', 'LIVE_TEST_CANCELLED', 'RESULT_AVAILABLE', 'SLOT_BOOKING', 'SUBSCRIPTION', 'GENERAL') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `entityType` VARCHAR(191) NULL,
    `entityId` VARCHAR(191) NULL,
    `actionUrl` VARCHAR(191) NULL,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NULL,

    INDEX `notifications_userId_readAt_idx`(`userId`, `readAt`),
    INDEX `notifications_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_preferences` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('PAYMENT', 'LIVE_TEST_SCHEDULE', 'LIVE_TEST_REMINDER', 'LIVE_TEST_CANCELLED', 'RESULT_AVAILABLE', 'SLOT_BOOKING', 'SUBSCRIPTION', 'GENERAL') NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `notification_preferences_userId_type_key`(`userId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_rules` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('PAYMENT', 'LIVE_TEST_SCHEDULE', 'LIVE_TEST_REMINDER', 'LIVE_TEST_CANCELLED', 'RESULT_AVAILABLE', 'SLOT_BOOKING', 'SUBSCRIPTION', 'GENERAL') NOT NULL,
    `offsetMinutesBeforeEvent` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `exam_cycles` ADD CONSTRAINT `exam_cycles_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_cycles` ADD CONSTRAINT `exam_cycles_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `syllabus_versions` ADD CONSTRAINT `syllabus_versions_examCycleId_fkey` FOREIGN KEY (`examCycleId`) REFERENCES `exam_cycles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `syllabus_topics` ADD CONSTRAINT `syllabus_topics_syllabusVersionId_fkey` FOREIGN KEY (`syllabusVersionId`) REFERENCES `syllabus_versions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `syllabus_topics` ADD CONSTRAINT `syllabus_topics_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `topics`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_exam_profiles` ADD CONSTRAINT `student_exam_profiles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_exam_profiles` ADD CONSTRAINT `student_exam_profiles_examCycleId_fkey` FOREIGN KEY (`examCycleId`) REFERENCES `exam_cycles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `live_tests` ADD CONSTRAINT `live_tests_examCycleId_fkey` FOREIGN KEY (`examCycleId`) REFERENCES `exam_cycles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `live_tests` ADD CONSTRAINT `live_tests_testId_fkey` FOREIGN KEY (`testId`) REFERENCES `tests`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `live_tests` ADD CONSTRAINT `live_tests_integrityPolicyId_fkey` FOREIGN KEY (`integrityPolicyId`) REFERENCES `integrity_policies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `live_tests` ADD CONSTRAINT `live_tests_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `live_test_attempts` ADD CONSTRAINT `live_test_attempts_liveTestId_fkey` FOREIGN KEY (`liveTestId`) REFERENCES `live_tests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `live_test_attempts` ADD CONSTRAINT `live_test_attempts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `live_test_attempts` ADD CONSTRAINT `live_test_attempts_testAttemptId_fkey` FOREIGN KEY (`testAttemptId`) REFERENCES `test_attempts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_integrity_events` ADD CONSTRAINT `exam_integrity_events_liveTestAttemptId_fkey` FOREIGN KEY (`liveTestAttemptId`) REFERENCES `live_test_attempts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_integrity_events` ADD CONSTRAINT `exam_integrity_events_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `live_test_audit_logs` ADD CONSTRAINT `live_test_audit_logs_liveTestId_fkey` FOREIGN KEY (`liveTestId`) REFERENCES `live_tests`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `live_test_audit_logs` ADD CONSTRAINT `live_test_audit_logs_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `test_slots` ADD CONSTRAINT `test_slots_liveTestId_fkey` FOREIGN KEY (`liveTestId`) REFERENCES `live_tests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `test_slots` ADD CONSTRAINT `test_slots_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `slot_reservations` ADD CONSTRAINT `slot_reservations_slotId_fkey` FOREIGN KEY (`slotId`) REFERENCES `test_slots`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `slot_reservations` ADD CONSTRAINT `slot_reservations_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `slot_reservations` ADD CONSTRAINT `slot_reservations_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `payments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `slot_bookings` ADD CONSTRAINT `slot_bookings_slotId_fkey` FOREIGN KEY (`slotId`) REFERENCES `test_slots`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `slot_bookings` ADD CONSTRAINT `slot_bookings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `slot_bookings` ADD CONSTRAINT `slot_bookings_reservationId_fkey` FOREIGN KEY (`reservationId`) REFERENCES `slot_reservations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `slot_bookings` ADD CONSTRAINT `slot_bookings_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `payments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `slot_bookings` ADD CONSTRAINT `slot_bookings_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `subscriptions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plan_entitlements` ADD CONSTRAINT `plan_entitlements_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `subscription_plans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `subscription_plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_preferences` ADD CONSTRAINT `notification_preferences_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

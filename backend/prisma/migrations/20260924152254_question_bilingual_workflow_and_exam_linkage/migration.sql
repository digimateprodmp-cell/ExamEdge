-- AlterTable
ALTER TABLE `questions` ADD COLUMN `examCycleId` VARCHAR(191) NULL,
    ADD COLUMN `examId` VARCHAR(191) NULL,
    ADD COLUMN `source` ENUM('MANUAL', 'IMPORTED', 'PREVIOUS_YEAR', 'AI_GENERATED', 'CURRENT_AFFAIRS') NOT NULL DEFAULT 'MANUAL',
    ADD COLUMN `sourceReference` VARCHAR(191) NULL,
    ADD COLUMN `status` ENUM('DRAFT', 'MISSING_ENGLISH', 'MISSING_HINDI', 'LANGUAGE_REVIEW_REQUIRED', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN `subTopicId` VARCHAR(191) NULL,
    ADD COLUMN `syllabusVersionId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `sub_topics` (
    `id` VARCHAR(191) NOT NULL,
    `topicId` VARCHAR(191) NOT NULL,
    `nameEn` VARCHAR(191) NOT NULL,
    `nameHi` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `sub_topics_topicId_idx`(`topicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `questions_subTopicId_idx` ON `questions`(`subTopicId`);

-- CreateIndex
CREATE INDEX `questions_examId_idx` ON `questions`(`examId`);

-- CreateIndex
CREATE INDEX `questions_examCycleId_idx` ON `questions`(`examCycleId`);

-- CreateIndex
CREATE INDEX `questions_syllabusVersionId_idx` ON `questions`(`syllabusVersionId`);

-- CreateIndex
CREATE INDEX `questions_status_idx` ON `questions`(`status`);

-- AddForeignKey
ALTER TABLE `sub_topics` ADD CONSTRAINT `sub_topics_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `topics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exams`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_examCycleId_fkey` FOREIGN KEY (`examCycleId`) REFERENCES `exam_cycles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_syllabusVersionId_fkey` FOREIGN KEY (`syllabusVersionId`) REFERENCES `syllabus_versions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_subTopicId_fkey` FOREIGN KEY (`subTopicId`) REFERENCES `sub_topics`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

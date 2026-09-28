-- AlterTable
ALTER TABLE `test_questions` ADD COLUMN `sectionId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `question_tags` (
    `id` VARCHAR(191) NOT NULL,
    `nameEn` VARCHAR(191) NOT NULL,
    `nameHi` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `question_tag_assignments` (
    `id` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `questionTagId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `question_tag_assignments_questionTagId_idx`(`questionTagId`),
    UNIQUE INDEX `question_tag_assignments_questionId_questionTagId_key`(`questionId`, `questionTagId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `test_sections` (
    `id` VARCHAR(191) NOT NULL,
    `testId` VARCHAR(191) NOT NULL,
    `titleEn` VARCHAR(191) NOT NULL,
    `titleHi` VARCHAR(191) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `questionLimit` INTEGER NULL,
    `marksPerQuestion` DECIMAL(6, 2) NULL,
    `negativeMarks` DECIMAL(6, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `test_sections_testId_idx`(`testId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `test_questions_sectionId_idx` ON `test_questions`(`sectionId`);

-- AddForeignKey
ALTER TABLE `question_tag_assignments` ADD CONSTRAINT `question_tag_assignments_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `questions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question_tag_assignments` ADD CONSTRAINT `question_tag_assignments_questionTagId_fkey` FOREIGN KEY (`questionTagId`) REFERENCES `question_tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `test_sections` ADD CONSTRAINT `test_sections_testId_fkey` FOREIGN KEY (`testId`) REFERENCES `tests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `test_questions` ADD CONSTRAINT `test_questions_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `test_sections`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE `question_tags` ADD COLUMN `legacyTagId` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `question_tags_legacyTagId_key` ON `question_tags`(`legacyTagId`);

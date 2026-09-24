-- AlterTable
ALTER TABLE `live_tests` ADD COLUMN `bilingualRequired` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `questions` ADD COLUMN `isLegacyGrandfathered` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `servingEligibility` ENUM('FULLY_ELIGIBLE', 'LEGACY_TEMPORARY', 'NOT_ELIGIBLE') NOT NULL DEFAULT 'NOT_ELIGIBLE';

-- AlterTable
ALTER TABLE `tests` ADD COLUMN `bilingualRequired` BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX `questions_servingEligibility_idx` ON `questions`(`servingEligibility`);

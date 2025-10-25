-- AlterTable
ALTER TABLE `push_subscriptions` ADD COLUMN `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE';

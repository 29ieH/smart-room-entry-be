/*
  Warnings:

  - Added the required column `unlockMethod` to the `access_logs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `access_logs` ADD COLUMN `unlockMethod` ENUM('CARD', 'FINGERPRINT', 'PASSWORD') NOT NULL;

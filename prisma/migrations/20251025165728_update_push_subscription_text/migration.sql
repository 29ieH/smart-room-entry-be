/*
  Warnings:

  - A unique constraint covering the columns `[endpoint]` on the table `push_subscriptions` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `push_subscriptions_endpoint_key` ON `push_subscriptions`;

-- AlterTable
ALTER TABLE `push_subscriptions` MODIFY `endpoint` TEXT NOT NULL,
    MODIFY `p256dh` TEXT NOT NULL,
    MODIFY `auth` TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `push_subscriptions_endpoint_key` ON `push_subscriptions`(`endpoint`(300));

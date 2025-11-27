/*
  Warnings:

  - You are about to drop the column `notificationToken` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `tokenExpires` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "users_notificationToken_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "notificationToken",
DROP COLUMN "tokenExpires";

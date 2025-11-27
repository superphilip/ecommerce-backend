-- AlterTable
ALTER TABLE "email_action_tokens" ADD COLUMN     "failedAttempts" INTEGER NOT NULL DEFAULT 0;

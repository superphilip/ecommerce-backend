-- CreateEnum
CREATE TYPE "EmailActionType" AS ENUM ('CONFIRM_NEW_EMAIL', 'REVERT_EMAIL', 'BLOCK_ACCOUNT', 'PASSWORD_RESET');

-- CreateTable
CREATE TABLE "email_action_tokens" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "action" "EmailActionType" NOT NULL,
    "oldEmail" TEXT,
    "newEmail" TEXT,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "meta" JSONB,

    CONSTRAINT "email_action_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_actions" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_action_tokens_userId_idx" ON "email_action_tokens"("userId");

-- CreateIndex
CREATE INDEX "email_action_tokens_action_idx" ON "email_action_tokens"("action");

-- CreateIndex
CREATE INDEX "account_actions_userId_idx" ON "account_actions"("userId");

-- AddForeignKey
ALTER TABLE "email_action_tokens" ADD CONSTRAINT "email_action_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_actions" ADD CONSTRAINT "account_actions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

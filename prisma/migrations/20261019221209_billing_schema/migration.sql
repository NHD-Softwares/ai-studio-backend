/*
  Warnings:

  - You are about to drop the column `balance` on the `user_credits` table. All the data in the column will be lost.
  - Added the required column `bucket` to the `credit_transactions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CreditBucket" AS ENUM ('CREDIT', 'SUBSCRIPTION_CREDITS');

-- AlterEnum
ALTER TYPE "CreditTransactionType" ADD VALUE 'SUBSCRIPTION_EXPIRE';

-- AlterTable
ALTER TABLE "credit_transactions" ADD COLUMN     "bucket" "CreditBucket" NOT NULL;

-- AlterTable
ALTER TABLE "user_credits" DROP COLUMN "balance",
ADD COLUMN     "creditBalance" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "subscriptionBalance" INTEGER NOT NULL DEFAULT 0;

-- RenameIndex
ALTER INDEX "one_active_subscription_per_user" RENAME TO "user_subscriptions_userId_key";

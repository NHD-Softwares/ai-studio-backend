/*
  Warnings:

  - You are about to drop the column `currency` on the `credit_plans` table. All the data in the column will be lost.
  - You are about to drop the column `priceMinor` on the `credit_plans` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `subscription_plans` table. All the data in the column will be lost.
  - You are about to drop the column `priceMinor` on the `subscription_plans` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'EGP');

-- AlterTable
ALTER TABLE "credit_plans" DROP COLUMN "currency",
DROP COLUMN "priceMinor";

-- AlterTable
ALTER TABLE "subscription_plans" DROP COLUMN "currency",
DROP COLUMN "priceMinor";

-- CreateTable
CREATE TABLE "prices" (
    "id" TEXT NOT NULL,
    "creditPlanId" TEXT,
    "subscriptionPlanId" TEXT,
    "currency" "Currency" NOT NULL,
    "amountMinor" INTEGER NOT NULL,

    CONSTRAINT "prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "prices_creditPlanId_currency_key" ON "prices"("creditPlanId", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "prices_subscriptionPlanId_currency_key" ON "prices"("subscriptionPlanId", "currency");

-- AddForeignKey
ALTER TABLE "prices" ADD CONSTRAINT "prices_creditPlanId_fkey" FOREIGN KEY ("creditPlanId") REFERENCES "credit_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prices" ADD CONSTRAINT "prices_subscriptionPlanId_fkey" FOREIGN KEY ("subscriptionPlanId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- Exactly one of the two plan IDs must be set (never both, never neither)
ALTER TABLE "prices"
  ADD CONSTRAINT price_exactly_one_plan
  CHECK (num_nonnulls("creditPlanId", "subscriptionPlanId") = 1),
  ADD CONSTRAINT price_positive
  CHECK ("amountMinor" > 0);
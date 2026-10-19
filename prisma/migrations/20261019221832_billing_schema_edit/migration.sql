-- This is an empty migration.-- ===== Custom constraints (Prisma can't express these) =====

-- 1. Neither balance may ever go negative, even if app code has a bug.
ALTER TABLE "user_credits"
  ADD CONSTRAINT credit_balance_non_negative       CHECK ("creditBalance" >= 0),
  ADD CONSTRAINT subscription_balance_non_negative CHECK ("subscriptionBalance" >= 0);

-- 2. An order must point at exactly one plan, and it must match its type.
ALTER TABLE "orders"
  ADD CONSTRAINT order_has_exactly_one_plan CHECK (
    ("type" = 'CREDIT_PACK'  AND "creditPlanId" IS NOT NULL AND "subscriptionPlanId" IS NULL)
    OR
    ("type" = 'SUBSCRIPTION' AND "subscriptionPlanId" IS NOT NULL AND "creditPlanId" IS NULL)
  );

-- 3. Ledger direction must match the row type (optional but recommended).
ALTER TABLE "credit_transactions"
  ADD CONSTRAINT delta_sign_matches_type CHECK (
    ("type" IN ('PURCHASE', 'SUBSCRIPTION_GRANT') AND "delta" > 0)
    OR
    ("type" IN ('SUBSCRIPTION_EXPIRE', 'SPEND')   AND "delta" < 0)
  );
-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price_monthly" DECIMAL(10,2) NOT NULL,
    "max_phone_numbers" INTEGER NOT NULL,
    "duration_months" INTEGER NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id")
);

-- Insert plans: Basic 1 number $5/1mo, Pro 5 numbers $5/3mo, Business 20 numbers $5/12mo
INSERT INTO "subscription_plans" ("id", "name", "price_monthly", "max_phone_numbers", "duration_months") VALUES
  ('basic', 'Basic', 5, 1, 1),
  ('pro', 'Pro', 5, 5, 3),
  ('business', 'Business', 5, 20, 12);

ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

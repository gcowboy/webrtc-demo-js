-- AlterTable: add balance, remove reg_tx columns
ALTER TABLE "users" ADD COLUMN "balance" DECIMAL(18,6) NOT NULL DEFAULT 0;
ALTER TABLE "users" DROP COLUMN IF EXISTS "reg_tx_id";
ALTER TABLE "users" DROP COLUMN IF EXISTS "reg_tx_amount";

-- CreateTable
CREATE TABLE "top_up_transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "amount" DECIMAL(18,6) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "top_up_transactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "top_up_transactions_tx_hash_key" ON "top_up_transactions"("tx_hash");

ALTER TABLE "top_up_transactions" ADD CONSTRAINT "top_up_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

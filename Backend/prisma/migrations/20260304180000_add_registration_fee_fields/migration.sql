-- AlterTable
ALTER TABLE "users" ADD COLUMN "account_type" TEXT;
ALTER TABLE "users" ADD COLUMN "status" TEXT;
ALTER TABLE "users" ADD COLUMN "reg_tx_id" TEXT;
ALTER TABLE "users" ADD COLUMN "reg_tx_amount" DECIMAL(18,6);
ALTER TABLE "users" ADD COLUMN "wallet" JSONB;
ALTER TABLE "users" ADD COLUMN "individual_reg_amount" DECIMAL(18,6);
ALTER TABLE "users" ADD COLUMN "team_reg_amount" DECIMAL(18,6);

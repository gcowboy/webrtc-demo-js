-- AlterTable: add status to top_up_transactions (only verified transactions count toward balance)
ALTER TABLE "top_up_transactions" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'verified';

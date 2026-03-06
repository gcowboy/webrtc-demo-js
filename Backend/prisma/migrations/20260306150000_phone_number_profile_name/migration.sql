-- AlterTable (IF NOT EXISTS so re-run after resolve --rolled-back is safe)
ALTER TABLE "PhoneNumber" ADD COLUMN IF NOT EXISTS "profile_name" TEXT;

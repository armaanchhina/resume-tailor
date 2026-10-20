-- DropIndex
DROP INDEX "public"."Resume_userId_key";

-- AlterTable
ALTER TABLE "Resume" ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'My Resume';

-- CreateIndex
CREATE INDEX "Resume_userId_idx" ON "Resume"("userId");

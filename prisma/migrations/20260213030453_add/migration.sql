/*
  Warnings:

  - You are about to drop the column `skills` on the `Resume` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Resume" DROP COLUMN "skills",
ADD COLUMN     "technicalSkillsJson" JSONB;

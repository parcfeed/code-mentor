/*
  Warnings:

  - You are about to alter the column `average_rating` on the `snippets` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(3,2)`.

*/
-- AlterTable
ALTER TABLE "snippets" ALTER COLUMN "average_rating" SET DATA TYPE DECIMAL(3,2);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "hashed_password" TEXT;

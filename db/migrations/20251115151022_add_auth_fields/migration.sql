/*
  Warnings:

  - Added the required column `hashedPassword` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GamePlayer" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hashedPassword" TEXT NOT NULL,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'USER';

/*
  Warnings:

  - You are about to drop the column `intervalAmount` on the `Period` table. All the data in the column will be lost.
  - You are about to drop the column `intervalType` on the `Period` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Period` table. All the data in the column will be lost.
  - You are about to drop the column `endedAt` on the `SeatPeriod` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `SeatPeriod` table. All the data in the column will be lost.
  - Added the required column `settingId` to the `Period` table without a default value. This is not possible if the table is not empty.
  - Made the column `endedAt` on table `Period` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Period" DROP COLUMN "intervalAmount",
DROP COLUMN "intervalType",
DROP COLUMN "title",
ADD COLUMN     "settingId" UUID NOT NULL,
ALTER COLUMN "endedAt" SET NOT NULL,
ALTER COLUMN "endedAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "endedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SeatPeriod" DROP COLUMN "endedAt",
DROP COLUMN "startedAt",
ADD COLUMN     "canOnlineBooked" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "PeriodSetting" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(50) NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(6),
    "intervalType" "TimeUnit" NOT NULL DEFAULT 'W',
    "intervalAmount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeriodSetting_pkey" PRIMARY KEY ("id")
);

/*
  Warnings:

  - You are about to drop the column `seatNo` on the `Seat` table. All the data in the column will be lost.
  - You are about to drop the column `specialtyId` on the `SpecialtyItem` table. All the data in the column will be lost.
  - You are about to drop the `SeatSlibing` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[prefix,no]` on the table `Seat` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[title]` on the table `SpecialtyItem` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `no` to the `Seat` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "SeatSlibing" DROP CONSTRAINT "SeatSlibing_nextSeatId_fkey";

-- DropForeignKey
ALTER TABLE "SeatSlibing" DROP CONSTRAINT "SeatSlibing_seatId_fkey";

-- DropForeignKey
ALTER TABLE "SpecialtyItem" DROP CONSTRAINT "SpecialtyItem_specialtyId_fkey";

-- DropIndex
DROP INDEX "Seat_prefix_seatNo_key";

-- AlterTable
ALTER TABLE "CategoriesOnMeals" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "Meal" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "Member" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "OrderLog" ALTER COLUMN "created_at" SET DEFAULT now();

-- AlterTable
ALTER TABLE "PaymentLog" ALTER COLUMN "created_at" SET DEFAULT now();

-- AlterTable
ALTER TABLE "Period" ALTER COLUMN "startedAt" SET DEFAULT now(),
ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "ReservationLog" ALTER COLUMN "reservedAt" SET DEFAULT now(),
ALTER COLUMN "startOfMeal" SET DEFAULT now(),
ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "ReservationSeat" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "ReservationSetting" ALTER COLUMN "created_at" SET DEFAULT now();

-- AlterTable
ALTER TABLE "Seat" DROP COLUMN "seatNo",
ADD COLUMN     "no" INTEGER NOT NULL,
ALTER COLUMN "created_at" SET DEFAULT now();

-- AlterTable
ALTER TABLE "SeatPeriod" ALTER COLUMN "startedAt" SET DEFAULT now(),
ALTER COLUMN "endedAt" SET DEFAULT now(),
ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "SpecialtiesOnMeals" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "Specialty" ALTER COLUMN "title" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "SpecialtyItem" DROP COLUMN "specialtyId",
ALTER COLUMN "title" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "createdAt" SET DEFAULT now();

-- DropTable
DROP TABLE "SeatSlibing";

-- CreateTable
CREATE TABLE "SpecialtiesOnSpecialtyItems" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "position" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "specialtyId" UUID NOT NULL,
    "specialtyItemId" UUID NOT NULL,

    CONSTRAINT "SpecialtiesOnSpecialtyItems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeatSibling" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP(3) NOT NULL,
    "seatId" UUID NOT NULL,
    "nextSeatId" UUID NOT NULL,

    CONSTRAINT "SeatSibling_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Seat_prefix_no_key" ON "Seat"("prefix", "no");

-- CreateIndex
CREATE UNIQUE INDEX "SpecialtyItem_title_key" ON "SpecialtyItem"("title");

-- AddForeignKey
ALTER TABLE "SpecialtiesOnSpecialtyItems" ADD CONSTRAINT "SpecialtiesOnSpecialtyItems_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialtiesOnSpecialtyItems" ADD CONSTRAINT "SpecialtiesOnSpecialtyItems_specialtyItemId_fkey" FOREIGN KEY ("specialtyItemId") REFERENCES "SpecialtyItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatSibling" ADD CONSTRAINT "SeatSibling_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "Seat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatSibling" ADD CONSTRAINT "SeatSibling_nextSeatId_fkey" FOREIGN KEY ("nextSeatId") REFERENCES "Seat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

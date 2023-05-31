/*
  Warnings:

  - You are about to drop the column `created_at` on the `OrderLog` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `OrderLog` table. All the data in the column will be lost.
  - You are about to drop the column `no` on the `Seat` table. All the data in the column will be lost.
  - You are about to drop the `SeatSibling` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SpecialtiesOnSpecialtyItems` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[prefix,seatNo]` on the table `Seat` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `OrderLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `seatNo` to the `Seat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `specialtyId` to the `SpecialtyItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "SeatSibling" DROP CONSTRAINT "SeatSibling_nextSeatId_fkey";

-- DropForeignKey
ALTER TABLE "SeatSibling" DROP CONSTRAINT "SeatSibling_seatId_fkey";

-- DropForeignKey
ALTER TABLE "SpecialtiesOnSpecialtyItems" DROP CONSTRAINT "SpecialtiesOnSpecialtyItems_specialtyId_fkey";

-- DropForeignKey
ALTER TABLE "SpecialtiesOnSpecialtyItems" DROP CONSTRAINT "SpecialtiesOnSpecialtyItems_specialtyItemId_fkey";

-- DropIndex
DROP INDEX "Seat_prefix_no_key";

-- AlterTable
ALTER TABLE "CategoriesOnMeals" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "Meal" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "Member" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "OrderLog" DROP COLUMN "created_at",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "OrderMeal" ALTER COLUMN "servedAmount" SET DEFAULT 0;

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
ALTER TABLE "Seat" DROP COLUMN "no",
ADD COLUMN     "seatNo" INTEGER NOT NULL,
ALTER COLUMN "created_at" SET DEFAULT now();

-- AlterTable
ALTER TABLE "SeatPeriod" ALTER COLUMN "startedAt" SET DEFAULT now(),
ALTER COLUMN "endedAt" SET DEFAULT now(),
ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "SpecialtiesOnMeals" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "Specialty" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "SpecialtyItem" ADD COLUMN     "specialtyId" UUID NOT NULL,
ALTER COLUMN "createdAt" SET DEFAULT now();

-- DropTable
DROP TABLE "SeatSibling";

-- DropTable
DROP TABLE "SpecialtiesOnSpecialtyItems";

-- CreateTable
CREATE TABLE "SeatSlibing" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP(3) NOT NULL,
    "seatId" UUID NOT NULL,
    "nextSeatId" UUID NOT NULL,

    CONSTRAINT "SeatSlibing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Seat_prefix_seatNo_key" ON "Seat"("prefix", "seatNo");

-- AddForeignKey
ALTER TABLE "SpecialtyItem" ADD CONSTRAINT "SpecialtyItem_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatSlibing" ADD CONSTRAINT "SeatSlibing_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "Seat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatSlibing" ADD CONSTRAINT "SeatSlibing_nextSeatId_fkey" FOREIGN KEY ("nextSeatId") REFERENCES "Seat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

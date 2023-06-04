/*
  Warnings:

  - You are about to drop the column `published_at` on the `Meal` table. All the data in the column will be lost.
  - The primary key for the `PaymentLog` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `created_at` on the `PaymentLog` table. All the data in the column will be lost.
  - You are about to drop the column `payment_no` on the `PaymentLog` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `PaymentLog` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `ReservationSetting` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `ReservationSetting` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `Seat` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `Seat` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `SeatSibling` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `SeatSibling` table. All the data in the column will be lost.
  - Added the required column `paymentNo` to the `PaymentLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `PaymentLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ReservationSetting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Seat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `SeatSibling` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CategoriesOnMeals" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "Meal" DROP COLUMN "published_at",
ADD COLUMN     "publishedAt" TIMESTAMPTZ,
ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "Member" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "OrderLog" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "PaymentLog" DROP CONSTRAINT "PaymentLog_pkey",
DROP COLUMN "created_at",
DROP COLUMN "payment_no",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
ADD COLUMN     "paymentNo" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "PaymentLog_pkey" PRIMARY KEY ("paymentNo");

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
ALTER TABLE "ReservationSetting" DROP COLUMN "created_at",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Seat" DROP COLUMN "created_at",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "SeatPeriod" ALTER COLUMN "startedAt" SET DEFAULT now(),
ALTER COLUMN "endedAt" SET DEFAULT now(),
ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "SeatSibling" DROP COLUMN "created_at",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "SpecialtiesOnMeals" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "SpecialtiesOnSpecialtyItems" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "Specialty" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "SpecialtyItem" ALTER COLUMN "createdAt" SET DEFAULT now();

/*
  Warnings:

  - You are about to drop the column `created_at` on the `OrderLog` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `OrderLog` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `OrderLog` table without a default value. This is not possible if the table is not empty.

*/
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
ALTER TABLE "Seat" ALTER COLUMN "created_at" SET DEFAULT now();

-- AlterTable
ALTER TABLE "SeatPeriod" ALTER COLUMN "startedAt" SET DEFAULT now(),
ALTER COLUMN "endedAt" SET DEFAULT now(),
ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "SeatSibling" ALTER COLUMN "created_at" SET DEFAULT now();

-- AlterTable
ALTER TABLE "SpecialtiesOnMeals" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "SpecialtiesOnSpecialtyItems" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "Specialty" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "SpecialtyItem" ALTER COLUMN "createdAt" SET DEFAULT now();

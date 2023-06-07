/*
  Warnings:

  - The `status` column on the `OrderLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[title]` on the table `Specialty` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "CategoriesOnMeals" DROP CONSTRAINT "CategoriesOnMeals_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "CategoriesOnMeals" DROP CONSTRAINT "CategoriesOnMeals_mealId_fkey";

-- DropForeignKey
ALTER TABLE "SpecialtiesOnMeals" DROP CONSTRAINT "SpecialtiesOnMeals_mealId_fkey";

-- DropForeignKey
ALTER TABLE "SpecialtiesOnMeals" DROP CONSTRAINT "SpecialtiesOnMeals_specialtyId_fkey";

-- DropForeignKey
ALTER TABLE "SpecialtyItem" DROP CONSTRAINT "SpecialtyItem_specialtyId_fkey";

-- DropIndex
DROP INDEX "Specialty_type_title_key";

-- AlterTable
ALTER TABLE "CategoriesOnMeals" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "Meal" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "Member" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "OrderLog" DROP COLUMN "status",
ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "created_at" SET DEFAULT now();

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
ALTER TABLE "SeatSlibing" ALTER COLUMN "created_at" SET DEFAULT now();

-- AlterTable
ALTER TABLE "SpecialtiesOnMeals" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "Specialty" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "SpecialtyItem" ALTER COLUMN "createdAt" SET DEFAULT now();

-- CreateIndex
CREATE UNIQUE INDEX "Specialty_title_key" ON "Specialty"("title");

-- AddForeignKey
ALTER TABLE "CategoriesOnMeals" ADD CONSTRAINT "CategoriesOnMeals_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoriesOnMeals" ADD CONSTRAINT "CategoriesOnMeals_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialtyItem" ADD CONSTRAINT "SpecialtyItem_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialtiesOnMeals" ADD CONSTRAINT "SpecialtiesOnMeals_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialtiesOnMeals" ADD CONSTRAINT "SpecialtiesOnMeals_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the `CategoriesOnMeals` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Meal` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CategoriesOnMeals" DROP CONSTRAINT "CategoriesOnMeals_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "CategoriesOnMeals" DROP CONSTRAINT "CategoriesOnMeals_mealId_fkey";

-- DropForeignKey
ALTER TABLE "OrderMeal" DROP CONSTRAINT "OrderMeal_mealId_fkey";

-- DropForeignKey
ALTER TABLE "SpecialtiesOnMeals" DROP CONSTRAINT "SpecialtiesOnMeals_mealId_fkey";

-- AlterTable
ALTER TABLE "Member" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "OrderLog" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "PaymentLog" ALTER COLUMN "createdAt" SET DEFAULT now();

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
ALTER TABLE "ReservationSetting" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "Seat" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "SeatPeriod" ALTER COLUMN "startedAt" SET DEFAULT now(),
ALTER COLUMN "endedAt" SET DEFAULT now(),
ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "SeatSibling" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "SpecialtiesOnMeals" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "SpecialtiesOnSpecialtyItems" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "Specialty" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "SpecialtyItem" ALTER COLUMN "createdAt" SET DEFAULT now();

-- DropTable
DROP TABLE "CategoriesOnMeals";

-- DropTable
DROP TABLE "Category";

-- DropTable
DROP TABLE "Meal";

-- CreateTable
CREATE TABLE "meals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(100) NOT NULL,
    "coverUrl" TEXT,
    "description" TEXT,
    "price" INTEGER NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(100) NOT NULL,
    "position" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_category" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mealId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,

    CONSTRAINT "meal_category_pkey" PRIMARY KEY ("mealId","categoryId")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_title_key" ON "categories"("title");

-- AddForeignKey
ALTER TABLE "meal_category" ADD CONSTRAINT "meal_category_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_category" ADD CONSTRAINT "meal_category_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialtiesOnMeals" ADD CONSTRAINT "SpecialtiesOnMeals_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderMeal" ADD CONSTRAINT "OrderMeal_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "meals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

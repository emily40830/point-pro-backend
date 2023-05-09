/*
  Warnings:

  - A unique constraint covering the columns `[account]` on the table `Member` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `Member` will be added. If there are existing duplicate values, this will fail.

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
ALTER TABLE "SpecialtiesOnMeals" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "Specialty" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "SpecialtyItem" ALTER COLUMN "createdAt" SET DEFAULT now();

-- CreateIndex
CREATE UNIQUE INDEX "Member_account_key" ON "Member"("account");

-- CreateIndex
CREATE UNIQUE INDEX "Member_email_key" ON "Member"("email");

/*
  Warnings:

  - The values [MUTIPLE] on the enum `SpecialtyType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SpecialtyType_new" AS ENUM ('SINGLE', 'MULTIPLE');
ALTER TABLE "Specialty" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Specialty" ALTER COLUMN "type" TYPE "SpecialtyType_new" USING ("type"::text::"SpecialtyType_new");
ALTER TYPE "SpecialtyType" RENAME TO "SpecialtyType_old";
ALTER TYPE "SpecialtyType_new" RENAME TO "SpecialtyType";
DROP TYPE "SpecialtyType_old";
ALTER TABLE "Specialty" ALTER COLUMN "type" SET DEFAULT 'SINGLE';
COMMIT;

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

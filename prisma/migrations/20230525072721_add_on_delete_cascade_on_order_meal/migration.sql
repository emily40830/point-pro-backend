-- DropForeignKey
ALTER TABLE "OrderMeal" DROP CONSTRAINT "OrderMeal_orderId_fkey";

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

-- AddForeignKey
ALTER TABLE "OrderMeal" ADD CONSTRAINT "OrderMeal_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "OrderLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

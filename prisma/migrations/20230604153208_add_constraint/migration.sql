-- DropForeignKey
ALTER TABLE "ReservationSeat" DROP CONSTRAINT "ReservationSeat_reservationLogId_fkey";

-- DropForeignKey
ALTER TABLE "ReservationSeat" DROP CONSTRAINT "ReservationSeat_seatPeriodId_fkey";

-- DropForeignKey
ALTER TABLE "SeatPeriod" DROP CONSTRAINT "SeatPeriod_periodId_fkey";

-- DropForeignKey
ALTER TABLE "SeatPeriod" DROP CONSTRAINT "SeatPeriod_seatId_fkey";

-- DropForeignKey
ALTER TABLE "SeatSibling" DROP CONSTRAINT "SeatSibling_nextSeatId_fkey";

-- DropForeignKey
ALTER TABLE "SeatSibling" DROP CONSTRAINT "SeatSibling_seatId_fkey";

-- AlterTable
ALTER TABLE "CategoriesOnMeals" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "Meal" ADD COLUMN     "isPopular" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "createdAt" SET DEFAULT now();

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

-- AddForeignKey
ALTER TABLE "SeatSibling" ADD CONSTRAINT "SeatSibling_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "Seat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatSibling" ADD CONSTRAINT "SeatSibling_nextSeatId_fkey" FOREIGN KEY ("nextSeatId") REFERENCES "Seat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatPeriod" ADD CONSTRAINT "SeatPeriod_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "Seat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatPeriod" ADD CONSTRAINT "SeatPeriod_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationSeat" ADD CONSTRAINT "ReservationSeat_reservationLogId_fkey" FOREIGN KEY ("reservationLogId") REFERENCES "ReservationLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationSeat" ADD CONSTRAINT "ReservationSeat_seatPeriodId_fkey" FOREIGN KEY ("seatPeriodId") REFERENCES "SeatPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('UNPAID', 'SUCCESS', 'CANCEL', 'PENDING');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('DineIn', 'TakeOut');

-- CreateEnum
CREATE TYPE "ReservationSettingType" AS ENUM ('reservation', 'period');

-- CreateEnum
CREATE TYPE "TimeUnit" AS ENUM ('Y', 'M', 'D', 'W', 'H', 'm', 's');

-- CreateEnum
CREATE TYPE "ReservationType" AS ENUM ('OnlineBooking', 'PhoneBooking', 'WalkInSeating');

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

-- CreateTable
CREATE TABLE "OrderLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "status" TEXT NOT NULL,
    "parentOrderId" UUID,
    "reservationLogId" UUID,
    "type" "OrderType" NOT NULL DEFAULT 'DineIn',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderMeal" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "orderId" UUID NOT NULL,
    "mealId" UUID NOT NULL,
    "mealTitle" VARCHAR(100),
    "price" INTEGER NOT NULL,
    "mealDetails" JSONB,
    "amount" INTEGER NOT NULL,
    "servedAmount" INTEGER NOT NULL,

    CONSTRAINT "OrderMeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentLog" (
    "orderId" UUID NOT NULL,
    "payment_no" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "gateway" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentLog_pkey" PRIMARY KEY ("payment_no")
);

-- CreateTable
CREATE TABLE "Seat" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "prefix" VARCHAR(2) NOT NULL,
    "seatNo" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 2,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Seat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeatSlibing" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "seatId" UUID NOT NULL,
    "nextSeatId" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeatSlibing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationSetting" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "ReservationSettingType" NOT NULL DEFAULT 'reservation',
    "unit" "TimeUnit" NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReservationSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Period" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(50) NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
    "endedAt" TIMESTAMP,
    "intervalType" "TimeUnit" NOT NULL DEFAULT 'W',
    "intervalAmount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Period_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeatPeriod" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "seatId" UUID NOT NULL,
    "periodId" UUID NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
    "endedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
    "canBooked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeatPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reservedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
    "options" JSONB DEFAULT '{}',
    "type" "ReservationType" NOT NULL DEFAULT 'OnlineBooking',
    "startOfMeal" TIMESTAMP(3) DEFAULT now(),
    "endOfMeal" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReservationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationSeat" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reservationLogId" UUID,
    "seatPeriodId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReservationSeat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Seat_prefix_seatNo_key" ON "Seat"("prefix", "seatNo");

-- CreateIndex
CREATE UNIQUE INDEX "ReservationSeat_reservationLogId_key" ON "ReservationSeat"("reservationLogId");

-- CreateIndex
CREATE UNIQUE INDEX "ReservationSeat_seatPeriodId_key" ON "ReservationSeat"("seatPeriodId");

-- AddForeignKey
ALTER TABLE "OrderLog" ADD CONSTRAINT "OrderLog_parentOrderId_fkey" FOREIGN KEY ("parentOrderId") REFERENCES "OrderLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLog" ADD CONSTRAINT "OrderLog_reservationLogId_fkey" FOREIGN KEY ("reservationLogId") REFERENCES "ReservationLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderMeal" ADD CONSTRAINT "OrderMeal_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "OrderLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderMeal" ADD CONSTRAINT "OrderMeal_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentLog" ADD CONSTRAINT "PaymentLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "OrderLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatSlibing" ADD CONSTRAINT "SeatSlibing_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "Seat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatSlibing" ADD CONSTRAINT "SeatSlibing_nextSeatId_fkey" FOREIGN KEY ("nextSeatId") REFERENCES "Seat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatPeriod" ADD CONSTRAINT "SeatPeriod_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "Seat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatPeriod" ADD CONSTRAINT "SeatPeriod_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationSeat" ADD CONSTRAINT "ReservationSeat_reservationLogId_fkey" FOREIGN KEY ("reservationLogId") REFERENCES "ReservationLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationSeat" ADD CONSTRAINT "ReservationSeat_seatPeriodId_fkey" FOREIGN KEY ("seatPeriodId") REFERENCES "SeatPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

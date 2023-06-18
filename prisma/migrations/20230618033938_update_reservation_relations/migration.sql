/*
  Warnings:

  - You are about to drop the column `seatPeriodId` on the `ReservationSeat` table. All the data in the column will be lost.
  - Added the required column `periodId` to the `ReservationSeat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `seatId` to the `ReservationSeat` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ReservationSeat" DROP CONSTRAINT "ReservationSeat_seatPeriodId_fkey";

-- DropIndex
DROP INDEX "ReservationSeat_seatPeriodId_key";

-- AlterTable
ALTER TABLE "ReservationSeat" DROP COLUMN "seatPeriodId",
ADD COLUMN     "periodId" UUID NOT NULL,
ADD COLUMN     "seatId" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "ReservationSeat" ADD CONSTRAINT "ReservationSeat_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "Seat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationSeat" ADD CONSTRAINT "ReservationSeat_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE CASCADE ON UPDATE CASCADE;

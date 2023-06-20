/*
  Warnings:

  - Made the column `reservationLogId` on table `ReservationSeat` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ReservationSeat" ALTER COLUMN "reservationLogId" SET NOT NULL;

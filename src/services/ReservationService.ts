import { Period, Prisma, ReservationType, Seat, SeatPeriod, SeatSibling } from '@prisma/client';
import { dayjs, prismaClient } from '../helpers';
import { CreateRecord } from '../types/reservation';

export class ReservationService {
  static createAutoReservedSeatsRecord = async (
    type: ReservationType,
    logId: string,
    periodStartedAt: Date,
    amount: number,
    options: { [key: string]: any },
  ): Promise<CreateRecord> => {
    if (amount === 5 || amount === 6 || amount > 10) {
      return {
        status: 400,
        details: 'people amount not supported',
        reservationLogId: '',
      };
    }
    const period = await prismaClient.period.findFirst({
      where: {
        startedAt: dayjs(periodStartedAt).toISOString(),
      },
    });

    if (!period) {
      return {
        status: 400,
        details: `Can not found period started at ${periodStartedAt}`,
        reservationLogId: '',
      };
    }

    const seatPeriods = await prismaClient.seatPeriod.findMany({
      where: {
        periodId: period?.id,
        canOnlineBooked: type === 'OnlineBooking',
        canBooked: true,
      },
      include: {
        seat: { include: { siblings: { include: { nextSeat: true } } } },
        period: true,
      },
    });

    let targetSeatPeriod:
      | (SeatPeriod & {
          period: Period;
          seat: Seat & {
            siblings: (SeatSibling & {
              nextSeat: Seat;
            })[];
          };
        })
      | undefined;

    if (amount < 3) {
      const twoSeats = seatPeriods.filter((seatPeriod) => {
        return seatPeriod.seat.amount === 2;
      });

      if (twoSeats.length < 1) {
        return {
          status: 404,
          details: 'There is no suitable seat, please try other period',
          reservationLogId: '',
        };
      }

      targetSeatPeriod = twoSeats[0];

      const createReservationLog: Prisma.ReservationLogCreateInput = {
        id: logId,
        reservedAt: new Date(),
        type,
        options,
        startOfMeal: null,
        bookedSeats: {
          create: [
            {
              seatId: targetSeatPeriod.seatId,
              periodId: targetSeatPeriod.periodId,
            },
          ],
        },
      };

      const updateSeatPeriod: Prisma.SeatPeriodUpdateInput = {
        canBooked: { set: false },
      };

      await prismaClient.$transaction([
        prismaClient.reservationLog.create({ data: createReservationLog }),
        prismaClient.seatPeriod.update({ data: updateSeatPeriod, where: { id: targetSeatPeriod.id } }),
      ]);
    } else if (amount === 3 || amount === 4) {
      const twoSeatPeriods = seatPeriods.filter((seatPeriod) => {
        const nextSeats = seatPeriod.seat.siblings;
        return nextSeats.length > 0
          ? seatPeriods.filter((seatPeriod) => nextSeats.length > 0 && seatPeriod.seatId === nextSeats[0].nextSeatId)
          : false;
      });

      if (twoSeatPeriods.length < 1) {
        return {
          status: 404,
          details: 'There is no suitable seat, please try other period',
          reservationLogId: '',
        };
      }

      targetSeatPeriod = twoSeatPeriods[0];

      const createReservationLog: Prisma.ReservationLogCreateInput = {
        id: logId,
        reservedAt: new Date(),
        type,
        options,
        startOfMeal: null,
        endOfMeal: null,
      };

      const createReservationSeats: Prisma.ReservationSeatCreateInput[] = [
        {
          seat: {
            connect: { id: targetSeatPeriod.seatId },
          },
          period: {
            connect: { id: targetSeatPeriod.periodId },
          },
          reservationLog: {
            connect: { id: logId },
          },
        },
        {
          seat: {
            connect: { id: targetSeatPeriod.seat.siblings[0].nextSeatId },
          },
          period: {
            connect: { id: targetSeatPeriod.periodId },
          },
          reservationLog: {
            connect: { id: logId },
          },
        },
      ];

      const nextSeatPeriod = await prismaClient.seatPeriod.findFirst({
        where: {
          seatId: targetSeatPeriod.seat.siblings[0].nextSeatId,
          periodId: targetSeatPeriod.periodId,
          canBooked: true,
        },
      });

      if (!nextSeatPeriod) {
        return {
          status: 404,
          details: 'Can not booked suitable seat',
          reservationLogId: '',
        };
      }

      const updateSeatPeriod: Prisma.SeatPeriodUpdateInput = {
        canBooked: { set: false },
      };

      await prismaClient.$transaction([
        prismaClient.reservationLog.create({ data: createReservationLog }),
        ...createReservationSeats.map((reservationSeat) =>
          prismaClient.reservationSeat.create({ data: reservationSeat }),
        ),
        prismaClient.seatPeriod.update({ data: updateSeatPeriod, where: { id: targetSeatPeriod.id } }),
        prismaClient.seatPeriod.update({ data: updateSeatPeriod, where: { id: nextSeatPeriod.id } }),
      ]);
    } else if (amount < 11 && amount > 6) {
      const targetSeatPeriods = seatPeriods.filter((seatPeriod) => {
        return seatPeriod.seat.amount === 10;
      });

      if (targetSeatPeriods.length < 1) {
        return {
          status: 404,
          details: 'There is no suitable seat, please try other period',
          reservationLogId: '',
        };
      }

      targetSeatPeriod = targetSeatPeriods[0];

      const createReservationLog: Prisma.ReservationLogCreateInput = {
        id: logId,
        reservedAt: new Date(),
        type,
        startOfMeal: null,
        endOfMeal: null,
        options,
        bookedSeats: {
          create: [
            {
              seatId: targetSeatPeriod.seatId,
              periodId: targetSeatPeriod.periodId,
            },
          ],
        },
      };

      const updateSeatPeriod: Prisma.SeatPeriodUpdateInput = {
        canBooked: { set: false },
      };

      await prismaClient.$transaction([
        prismaClient.reservationLog.create({ data: createReservationLog }),
        prismaClient.seatPeriod.update({ data: updateSeatPeriod, where: { id: targetSeatPeriod.id } }),
      ]);
    } else {
      return {
        status: 400,
        details: 'Invalid Input',
        reservationLogId: '',
      };
    }

    const reservation = await prismaClient.reservationSeat.findFirst({
      where: {
        seatId: targetSeatPeriod?.seatId,
        periodId: targetSeatPeriod?.periodId,
      },
      select: {
        reservationLogId: true,
      },
    });

    if (reservation && reservation.reservationLogId) {
      return {
        status: 201,
        details: '',
        reservationLogId: reservation.reservationLogId,
      };
    }

    return {
      status: 500,
      details: 'Create reservation failed',
      reservationLogId: '',
    };
  };
}

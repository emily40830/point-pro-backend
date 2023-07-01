import { Prisma, ReservationType, SeatPeriod, Period, Seat, SeatSibling } from '@prisma/client';
import client from './client';

const findSeatPeriods = async (amount: number, type: ReservationType, periodId: string) => {
  const seatPeriods = await client.seatPeriod.findMany({
    where: {
      periodId,
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
      //   return {
      //     status: 404,
      //     details: 'There is no suitable seat, please try other period',
      //     reservationLogId: '',
      //   };
      return [];
    }

    targetSeatPeriod = twoSeats[0];

    return [targetSeatPeriod.seatId];
  } else if (amount === 3 || amount === 4) {
    const twoSeatPeriods = seatPeriods.filter((seatPeriod) => {
      const nextSeats = seatPeriod.seat.siblings;
      return nextSeats.length > 0
        ? seatPeriods.filter((seatPeriod) => nextSeats.length > 0 && seatPeriod.seatId === nextSeats[0].nextSeatId)
        : false;
    });

    if (twoSeatPeriods.length < 1) {
      return [];
      //   return {
      //     status: 404,
      //     details: 'There is no suitable seat, please try other period',
      //     reservationLogId: '',
      //   };
    }

    targetSeatPeriod = twoSeatPeriods[0];

    // const createReservationLog: Prisma.ReservationLogCreateInput = {
    //   id: logId,
    //   reservedAt: new Date(),
    //   type: 'OnlineBooking',
    //   options,
    //   startOfMeal: null,
    //   endOfMeal: null,
    // };
    const nextSeatPeriod = await client.seatPeriod.findFirst({
      where: {
        seatId: targetSeatPeriod.seat.siblings[0].nextSeatId,
        periodId: targetSeatPeriod.periodId,
      },
    });

    if (!nextSeatPeriod) {
      return [];
      //   return {
      //     status: 404,
      //     details: 'Can not booked suitable seat',
      //     reservationLogId: '',
      //   };
    }

    return [targetSeatPeriod.seatId, targetSeatPeriod.seat.siblings[0].nextSeatId];

    // const createReservationSeats: Prisma.ReservationSeatCreateInput[] = [
    //   {
    //     seat: {
    //       connect: { id: targetSeatPeriod.seatId },
    //     },
    //     period: {
    //       connect: { id: targetSeatPeriod.periodId },
    //     },
    //     reservationLog: {
    //       connect: { id: logId },
    //     },
    //   },
    //   {
    //     seat: {
    //       connect: { id: targetSeatPeriod.seat.siblings[0].nextSeatId },
    //     },
    //     period: {
    //       connect: { id: targetSeatPeriod.periodId },
    //     },
    //     reservationLog: {
    //       connect: { id: logId },
    //     },
    //   },
    // ];

    // const updateSeatPeriod: Prisma.SeatPeriodUpdateInput = {
    //   canBooked: { set: false },
    // };

    // await prismaClient.$transaction([
    //   prismaClient.reservationLog.create({ data: createReservationLog }),
    //   ...createReservationSeats.map((reservationSeat) =>
    //     prismaClient.reservationSeat.create({ data: reservationSeat }),
    //   ),
    //   prismaClient.seatPeriod.update({ data: updateSeatPeriod, where: { id: targetSeatPeriod.id } }),
    //   prismaClient.seatPeriod.update({ data: updateSeatPeriod, where: { id: nextSeatPeriod.id } }),
    // ]);
  } else if (amount < 11 && amount > 6) {
    const targetSeatPeriods = seatPeriods.filter((seatPeriod) => {
      return seatPeriod.seat.amount === 10;
    });

    if (targetSeatPeriods.length < 1) {
      //   return {
      //     status: 404,
      //     details: 'There is no suitable seat, please try other period',
      //     reservationLogId: '',
      //   };
      return [];
    }

    targetSeatPeriod = targetSeatPeriods[0];

    return [targetSeatPeriod.seatId];
  } else {
    return [];
  }
};

const main = async () => {
  const reservationLogs = await client.reservationLog.findMany({
    where: {
      bookedSeats: {
        none: {},
      },
    },
    include: { bookedSeats: true },
  });

  for (let reservationLog of reservationLogs) {
    if (reservationLog.bookedSeats.length > 0) {
      continue;
    }
    console.log(reservationLog);
    const amount = [
      '7e996dab-94c6-4a87-90a6-8fa682899172',
      '25378bc6-0b0f-4f31-b558-43d468a4783b',
      'f60b2801-659e-4b2a-aa67-722b7ee5dfc9',
    ].includes(reservationLog.id)
      ? 4
      : reservationLog.id === 'f60b2801-659e-4b2a-aa67-722b7ee5dfc9'
      ? 7
      : 1;
    // console.log(amount);
    const periods = await client.period.findMany({
      where: {
        startedAt: {
          gte: new Date(),
        },
      },
    });

    const randomIndex = Math.floor(Math.random() * periods.length);

    const targetSeatPeriods = await findSeatPeriods(amount, reservationLog.type, periods[randomIndex].id);

    const updateSeatPeriod: Prisma.SeatPeriodUpdateInput = {
      canBooked: { set: false },
    };

    const createReservationSeats = targetSeatPeriods.map((sp) => {
      return client.reservationSeat.create({
        data: {
          seat: { connect: { id: sp } },
          period: { connect: { id: periods[randomIndex].id } },
          reservationLog: { connect: { id: reservationLog.id } },
        },
      });
    });

    await client.$transaction([
      ...createReservationSeats,
      client.seatPeriod.updateMany({
        data: updateSeatPeriod,
        where: {
          seatId: {
            in: targetSeatPeriods,
          },
          periodId: periods[randomIndex].id,
        },
      }),
    ]);
  }
};

main();

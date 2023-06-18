import { Prisma, Period } from '@prisma/client';
import { seats } from '../data';

export const getSeatPeriods = (periodsData: Period[]): Prisma.SeatPeriodCreateInput[] => {
  const seatsWithOnlineBooked = seats.data.filter((seat) => seat?.canOnlineBooked === true);

  const seatPeriods = seatsWithOnlineBooked.reduce<Prisma.SeatPeriodCreateInput[]>(
    (prevSeatPeriods: Prisma.SeatPeriodCreateInput[], currSeat) => {
      const allPeriodsForCurrentSeat: Prisma.SeatPeriodCreateInput[] = periodsData.map((period) => ({
        canOnlineBooked: true,
        canBooked: true,
        seat: {
          connectOrCreate: {
            where: {
              seatNo: { prefix: currSeat.prefix, no: currSeat.no },
            },
            create: {
              prefix: currSeat.prefix,
              no: currSeat.no,
              amount: currSeat.peopleAmount,
            },
          },
        },
        period: { connect: { id: period.id } },
      }));

      return [...prevSeatPeriods, ...allPeriodsForCurrentSeat];
    },
    [],
  );
  return seatPeriods;
};

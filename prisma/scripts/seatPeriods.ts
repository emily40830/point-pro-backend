import { Prisma, Period, Seat } from '@prisma/client';
import { seats } from '../data';

export const getSeatPeriods = (periodsData: Period[], seatsData: Seat[]): Prisma.SeatPeriodCreateInput[] => {
  const seatsWithOnlineBooked = seats.data
    .filter((seat) => seat?.canOnlineBooked === true)
    .map((seat) => seat.prefix + '-' + seat.no);

  const seatsDataWithOnlineBooked = seatsData.filter((d) => seatsWithOnlineBooked.includes(d.prefix + '-' + d.no));

  const seatPeriods = seatsDataWithOnlineBooked.reduce<Prisma.SeatPeriodCreateInput[]>(
    (prevSeatPeriods: Prisma.SeatPeriodCreateInput[], currSeat) => {
      const allPeriodsForCurrentSeat: Prisma.SeatPeriodCreateInput[] = periodsData.map((period) => ({
        canOnlineBooked: true,
        canBooked: true,
        seat: {
          connect: { id: currSeat.id },
        },
        period: { connect: { id: period.id } },
      }));

      return [...prevSeatPeriods, ...allPeriodsForCurrentSeat];
    },
    [],
  );
  return seatPeriods;
};

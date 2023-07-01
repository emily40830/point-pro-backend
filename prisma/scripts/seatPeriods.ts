import { Prisma, Period, Seat } from '@prisma/client';
import { seats } from '../data';

export const getSeatPeriods = (periodsData: Period[], seatsData: Seat[]): Prisma.SeatPeriodCreateInput[] => {
  const seatsWithBookingSetting = seats.data.map((seat) => ({ ...seat, seatNo: seat.prefix + '-' + seat.no }));

  const seatPeriods = seatsData.reduce<Prisma.SeatPeriodCreateInput[]>(
    (prevSeatPeriods: Prisma.SeatPeriodCreateInput[], currSeat) => {
      const setting = seatsWithBookingSetting.find((s) => s.prefix === currSeat.prefix && s.no === currSeat.no);
      const allPeriodsForCurrentSeat: Prisma.SeatPeriodCreateInput[] = periodsData.map((period) => ({
        canOnlineBooked: setting?.canOnlineBooked ?? false,
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

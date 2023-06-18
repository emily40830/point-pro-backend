import { Prisma, Period } from '@prisma/client';
import { seats } from '../data';

export const getSeatPeriods = (periodsData: Period[]): Prisma.SeatPeriodCreateInput[] => {
  const seatsWithOnlineBooked = seats.data.filter((seat) => seat?.canOnlineBooked === true);

  const seatPeriods = seatsWithOnlineBooked.reduce<Prisma.SeatPeriodCreateInput[]>(
    (prevSeatPeriods: Prisma.SeatPeriodCreateInput[], currSeat) => {
      const allPeriodsForCurrentSeat: Prisma.SeatPeriodCreateInput[] = periodsData.map((period) => ({
        canOnlineBooked: true,
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

// seats.reduce<Prisma.SeatPeriodCreateInput[]>((prevSeatPeriods: Prisma.SeatPeriodCreateInput[], currSeat: Seat) => {

//   const allPeriodsForCurrentSeats = periods.reduce<Prisma.SeatPeriodCreateInput[]>((prevPeriods, currPeriod) => {
//     const periodEndTime = currPeriod.endedAt || new Date(dayjs(currPeriod.startedAt).add(2, 'months').toISOString());
//     const periodStartTime = currPeriod.startedAt || new Date();

//     const currPeriodSettings: Prisma.SeatPeriodCreateInput[] = [];

//     for (
//       let curr = periodStartTime;
//       curr < periodEndTime;
//       curr = new Date(dayjs(curr).add(1, 'week').toISOString())
//     ) {
//       const currSeatPeriod = {
//         startedAt: curr,
//         endedAt: dayjs(curr).add(2, 'hours').toDate(),
//         canBooked: true,
//         seat: { connect: { id: currSeat.id } },
//         period: { connect: { id: currPeriod.id } },
//       };
//       console.log(curr, currSeat.prefix + '-' + currSeat.no);
//       currPeriodSettings.push(currSeatPeriod);
//     }

//     return [...prevPeriods, ...currPeriodSettings];
//   }, []);

//   return [...prevSeatPeriods, ...allPeriodsForCurrentSeats];
// }, []);

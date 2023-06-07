import * as uuid from 'uuid';
import { Prisma, ReservationSettingType, TimeUnit, Seat, Period } from '@prisma/client';
import { reservations, seats } from '../data';
import dayjs from 'dayjs';

export const getSeats = (): {
  seats: Prisma.SeatCreateInput[];
  siblings: {
    seat: string;
    nextSeat: string;
  }[];
} => {
  const { data: seatsData, siblings } = seats;

  return {
    seats: seatsData.map((seat) => ({
      id: uuid.v4(),
      prefix: seat.prefix,
      no: seat.no,
      amount: seat.peopleAmount,
    })),
    siblings,
  };
};

const getReservationSettings = (): Prisma.ReservationSettingCreateInput[] => {
  return reservations.settings.map((setting) => ({
    type: setting.type as ReservationSettingType,
    unit: setting.unit as TimeUnit,
    amount: setting.amount,
  }));
};

export const getPeriods = (): Prisma.PeriodCreateInput[] => {
  return reservations.periods.map((period) => ({
    title: period.title,
    intervalType: period.intervalType as TimeUnit,
    intervalAmount: period.intervalAmount,
    startedAt: new Date(period.startedAt),
  }));
};

export const getSeatPeriods = (seats: Seat[], periods: Period[]): Prisma.SeatPeriodCreateInput[] =>
  seats.reduce<Prisma.SeatPeriodCreateInput[]>((prevSeatPeriods: Prisma.SeatPeriodCreateInput[], currSeat: Seat) => {
    const allPeriodsForCurrentSeats = periods.reduce<Prisma.SeatPeriodCreateInput[]>((prevPeriods, currPeriod) => {
      const periodEndTime = currPeriod.endedAt || new Date(dayjs(currPeriod.startedAt).add(2, 'months').toISOString());
      const periodStartTime = currPeriod.startedAt || new Date();

      const currPeriodSettings: Prisma.SeatPeriodCreateInput[] = [];

      for (
        let curr = periodStartTime;
        curr < periodEndTime;
        curr = new Date(dayjs(curr).add(1, 'week').toISOString())
      ) {
        const currSeatPeriod = {
          startedAt: curr,
          endedAt: dayjs(curr).add(2, 'hours').toDate(),
          canBooked: true,
          seat: { connect: { id: currSeat.id } },
          period: { connect: { id: currPeriod.id } },
        };
        console.log(curr, currSeat.prefix + '-' + currSeat.no);
        currPeriodSettings.push(currSeatPeriod);
      }

      return [...prevPeriods, ...currPeriodSettings];
    }, []);

    return [...prevSeatPeriods, ...allPeriodsForCurrentSeats];
  }, []);
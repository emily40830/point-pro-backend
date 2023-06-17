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

const getPeriodSettings = (): Prisma.PeriodSettingCreateInput[] => {
  return reservations.periods.map((period) => ({
    title: period.title,
    intervalType: period.intervalType as TimeUnit,
    intervalAmount: period.intervalAmount,
    startedAt: new Date(period.startedAt),
  }));
};

export const getPeriods = (): Prisma.PeriodCreateInput[] => {
  const result: Prisma.PeriodCreateInput[] = [];

  const settings = getPeriodSettings();
  for (let setting of settings) {
    const periodEndTime = setting.endedAt || new Date(dayjs(setting.startedAt).add(2, 'months').toISOString());
    const periodStartTime = setting.startedAt || new Date();

    for (let curr = periodStartTime; curr < periodEndTime; curr = new Date(dayjs(curr).add(1, 'week').toISOString())) {
      const currPeriod = {
        startedAt: curr,
        endedAt: dayjs(curr).add(2, 'hours').toDate(),
      };
      result.push(currPeriod);
    }
  }

  return result;
};

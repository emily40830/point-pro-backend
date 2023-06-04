import { Prisma, ReservationSettingType, TimeUnit } from '@prisma/client';
import { reservations } from '../data';

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

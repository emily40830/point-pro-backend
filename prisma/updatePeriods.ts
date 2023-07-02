import { Prisma, ReservationType, SeatPeriod, Period, Seat, SeatSibling } from '@prisma/client';
import client from './client';
import { object, date as dateSchema } from 'yup';
import { getSeatPeriods } from './scripts/seatPeriods';

const getDefaultDate = () => {
  const dateInput = object({
    date: dateSchema()
      .optional()
      .default(() => new Date()),
  });
  const todayDateString = new Date().toLocaleDateString('zh-tw');
  const { date } = dateInput.cast({ date: todayDateString });

  return date;
};
export const getDateOnly = (targetDate: Date) => {
  const dateInput = object({
    date: dateSchema()
      .optional()
      .default(() => new Date()),
  });
  const todayDateString = targetDate.toLocaleDateString('zh-tw');
  const { date } = dateInput.cast({ date: todayDateString });

  return date;
};

// 1. add a period
// 2. put period to line 41

const main = async () => {
  const periodId = '46e0018a-f24e-427c-8928-fa4f43f20ca9';

  const today = getDefaultDate();
  const nextDate = getDateOnly(today);
  nextDate.setDate(nextDate.getDate() + 1);

  console.log(today, nextDate);

  const period = await client.period.findUnique({
    where: {
      id: periodId, // Please update to your period id
    },
  });
  if (!period) {
    console.error(`Can not get period ${periodId}`);
    return null;
  }

  const seats = await client.seat.findMany({});
  // const onePeriod = [periods[0]];

  const seatPeriods = getSeatPeriods([period], seats);

  const createSeatPeriods = seatPeriods.map((seatPeriod, index) => {
    console.log(index, seatPeriod);
    return client.seatPeriod.create({ data: seatPeriod });
  });

  for (let a of createSeatPeriods) {
    const result = await a;
    console.log(result);
  }
};

main();

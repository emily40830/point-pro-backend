import { Prisma } from '@prisma/client';
import SingletonRedis from '../helpers/SingletonRedis';
import { DatePeriodInfo, PeriodInfo } from '../types/shared';
import { dayjs, prismaClient } from '../helpers';

export class PeriodService {
  static getPeriods = async (isOnlineBooking: boolean, dateFrom: Date, dateTo: Date, excludeTime: boolean) => {
    const dateFromString = dayjs(dateFrom).format('YYYY/MM/DD');
    const dateToString = dayjs(dateTo).format('YYYY/MM/DD');

    const dateTimeFromString = dayjs(dateFrom).format('YYYY/MM/DD:HH');
    const dateTimeToString = dayjs(dateTo).format('YYYY/MM/DD:HH');

    const cacheKey = excludeTime
      ? `periods:${dateFromString}:${dateToString}:${isOnlineBooking ? 'online' : 'phone'}`
      : `periods:${dateTimeFromString}:${dateTimeToString}:${isOnlineBooking ? 'online' : 'phone'}`;

    const periods = await SingletonRedis.getInstance().getClient().get(cacheKey);

    if (!periods) {
      const isOnlineFilter: Prisma.SeatPeriodWhereInput = isOnlineBooking
        ? { canOnlineBooked: true }
        : { canOnlineBooked: { not: true } };
      const periods = await prismaClient.period.findMany({
        where: {
          startedAt: {
            gte: dateFrom,
            lte: dateTo,
          },
          seatPeriod: {
            some: isOnlineFilter,
          },
        },
        include: {
          seatPeriod: {
            where: isOnlineFilter,
            include: {
              seat: {
                select: {
                  prefix: true,
                  no: true,
                  amount: true,
                },
              },
            },
          },
        },
      });

      const periodsWithAmount: PeriodInfo[] = periods.map((period) => {
        let total = 0;
        let available = 0;

        period.seatPeriod.forEach((seatPeriod) => {
          if (seatPeriod.canBooked) {
            available += seatPeriod.seat.amount;
          }
          total += seatPeriod.seat.amount;
        });
        return {
          id: period.id,
          periodStartedAt: period.startedAt,
          periodEndedAt: period.endedAt,
          amount: total,
          available,
        };
      });

      const datePeriodsWithAmount = periodsWithAmount
        .sort((a, b) => a.periodStartedAt.valueOf() - b.periodEndedAt.valueOf())
        .reduce<DatePeriodInfo[]>((prev, curr) => {
          const targets = prev.filter(
            (d) => d.date.toLocaleDateString('zh-tw') === curr.periodStartedAt.toLocaleDateString('zh-tw'),
          );

          if (targets.length === 0) {
            const newDatePeriod: DatePeriodInfo = {
              date: curr.periodStartedAt,
              periods: [curr],
              totalAmount: curr.amount,
              totalAvailable: curr.available,
            };

            return [...prev, newDatePeriod];
          }
          const target = targets[0];

          const newTarget = {
            ...target,
            periods: [...target.periods, curr],
            totalAmount: target.totalAmount + curr.amount,
            totalAvailable: target.totalAvailable + curr.available,
          };

          return [
            ...prev.filter(
              (d) => d.date.toLocaleDateString('zh-tw') !== curr.periodStartedAt.toLocaleDateString('zh-tw'),
            ),
            newTarget,
          ];
        }, []);

      const data = datePeriodsWithAmount.sort((a, b) => a.date.valueOf() - b.date.valueOf());

      await SingletonRedis.getInstance()
        .getClient()
        .set(cacheKey, JSON.stringify(data), 'EX', excludeTime ? 60 * 60 * 12 : 60 * 9);

      return data;
    } else {
      console.log('get');
      return JSON.parse(periods);
    }
  };
  static delPeriods = async () => {
    const keys = await SingletonRedis.getInstance().getClient().keys(`periods:*:online`);
    console.log(keys);
    if (keys.length > 0) {
      await SingletonRedis.getInstance().getClient().del(keys);
    }
  };
}

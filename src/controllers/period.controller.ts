import { object, date as dateSchema, boolean } from 'yup';
import { getDateOnly, getDefaultDate, prismaClient } from '../helpers';
import { ApiResponse, AuthRequest, PeriodInfo, DatePeriodInfo } from '../types/shared';
import { Period, Prisma } from '@prisma/client';
import { PeriodService } from '../services';

class PeriodController {
  public static getPeriods = async (req: AuthRequest, res: ApiResponse<DatePeriodInfo[]>) => {
    const querySchema = object({
      date: dateSchema().required(),
      excludeTime: boolean()
        .optional()
        .default(() => true),
      isOnlineBooking: boolean()
        .optional()
        .default(() => true),
    });
    try {
      await querySchema.validate(req.query);
    } catch (error) {
      return res.status(400).send({
        message: 'invalid date format',
        result: null,
      });
    }

    const { date, excludeTime, isOnlineBooking } = querySchema.cast(req.query);

    // date : undefined; excludeTime: true
    // -> from: getDefaultDate(); to: from.setDate(nextTargetDate.getDate() + 30 * 6)

    // date: undefined; excludeTime: false
    // -> from: new Date(); to: from.setDate(nextTargetDate.getDate() + 30 * 6)

    // date: 2023-06-25; excludeTime: true
    // -> from: getDateOnly(date); to: from.setDate(nextTargetDate.getDate() + 1)

    // date: 2023-06-25; excludeTime: false
    // -> from: date; to: getDateOnly(date).setDate(getDateOnly(date).getDate() + 1)
    console.log(date, excludeTime, isOnlineBooking);

    const targetDate = excludeTime ? getDateOnly(date) : date;

    if (process.env?.TIME_ENV === 'prod') {
      targetDate.setHours(targetDate.getHours() - 8);
    }
    let nextTargetDate = new Date(targetDate);

    if (date) {
      console.log('here');
      nextTargetDate.setDate(nextTargetDate.getDate() + 1);
    } else {
      nextTargetDate.setDate(nextTargetDate.getDate() + 30 * 6);
    }

    if (process.env?.TIME_ENV === 'prod') {
      nextTargetDate.setHours(nextTargetDate.getHours() + 16);
    }

    console.log(targetDate, nextTargetDate);
    const result = await PeriodService.getPeriods(isOnlineBooking, targetDate, nextTargetDate, excludeTime);
    // const isOnlineFilter: Prisma.SeatPeriodWhereInput = isOnlineBooking
    //   ? { canOnlineBooked: true }
    //   : { canOnlineBooked: { not: true } };
    // const periods = await prismaClient.period.findMany({
    //   where: {
    //     startedAt: {
    //       gte: targetDate,
    //       lte: nextTargetDate,
    //     },
    //     seatPeriod: {
    //       some: isOnlineFilter,
    //     },
    //   },
    //   include: {
    //     seatPeriod: {
    //       where: isOnlineFilter,
    //       include: {
    //         seat: {
    //           select: {
    //             prefix: true,
    //             no: true,
    //             amount: true,
    //           },
    //         },
    //       },
    //     },
    //   },
    // });

    // const periodsWithAmount: PeriodInfo[] = periods.map((period) => {
    //   let total = 0;
    //   let available = 0;

    //   period.seatPeriod.forEach((seatPeriod) => {
    //     if (seatPeriod.canBooked) {
    //       available += seatPeriod.seat.amount;
    //     }
    //     total += seatPeriod.seat.amount;
    //   });
    //   return {
    //     id: period.id,
    //     periodStartedAt: period.startedAt,
    //     periodEndedAt: period.endedAt,
    //     amount: total,
    //     available,
    //   };
    // });

    // const datePeriodsWithAmount = periodsWithAmount.reduce<DatePeriodInfo[]>((prev, curr) => {
    //   const targets = prev.filter(
    //     (d) => d.date.toLocaleDateString('zh-tw') === curr.periodStartedAt.toLocaleDateString('zh-tw'),
    //   );

    //   if (targets.length === 0) {
    //     const newDatePeriod: DatePeriodInfo = {
    //       date: curr.periodStartedAt,
    //       periods: [curr],
    //       totalAmount: curr.amount,
    //       totalAvailable: curr.available,
    //     };

    //     return [...prev, newDatePeriod];
    //   }
    //   const target = targets[0];

    //   const newTarget = {
    //     ...target,
    //     periods: [...target.periods, curr],
    //     totalAmount: target.totalAmount + curr.amount,
    //     totalAvailable: target.totalAvailable + curr.available,
    //   };

    //   return [
    //     ...prev.filter((d) => d.date.toLocaleDateString('zh-tw') !== curr.periodStartedAt.toLocaleDateString('zh-tw')),
    //     newTarget,
    //   ];
    // }, []);

    res.status(200).send({
      message: 'Successfully get periods',
      result,
    });
  };
  public static getPeriodList = async (
    req: AuthRequest,
    res: ApiResponse<Pick<PeriodInfo, 'id' | 'periodStartedAt' | 'periodEndedAt'>[]>,
  ) => {
    try {
      const periods = await prismaClient.period.findMany({
        where: {
          startedAt: {
            gte: new Date(),
          },
        },
      });

      const result = periods.map((period) => ({
        id: period.id,
        periodStartedAt: period.startedAt,
        periodEndedAt: period.endedAt,
      }));

      return res.status(200).json({
        message: 'successfully get periods',
        result: result.sort((a, b) => a.periodStartedAt.valueOf() - b.periodStartedAt.valueOf()),
      });
    } catch (error) {
      return res.status(500).json({
        message: (error as Error).message,
        result: null,
      });
    }
  };
}

export default PeriodController;

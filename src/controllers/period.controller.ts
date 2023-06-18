import { object, date as dateSchema } from 'yup';
import { prismaClient } from '../helpers';
import { ApiResponse, AuthRequest } from '../types/shared';

type PeriodInfo = {
  id: string;
  periodStartedAt: Date;
  amount: number;
  available: number;
};

type DatePeriodInfo = {
  date: Date;
  periods: PeriodInfo[];
  totalAmount: number;
  totalAvailable: number;
};

class PeriodController {
  public static getPeriodByDate = async (req: AuthRequest, res: ApiResponse) => {
    const querySchema = object({
      date: dateSchema()
        .optional()
        .default(() => new Date()),
    });

    try {
      await querySchema.validate(req.query);
    } catch (error) {
      return res.status(400).send({
        message: 'invalid date format',
        result: null,
      });
    }

    try {
      const { date } = querySchema.cast(req.query);

      const targetDate = date || new Date();
      const nextTargetDate = new Date(targetDate);

      nextTargetDate.setDate(nextTargetDate.getDate() + 1);
      console.log(targetDate, nextTargetDate);

      const periods = await prismaClient.period.findMany({
        where: {
          startedAt: {
            gte: targetDate,
            lte: nextTargetDate,
          },
        },
        include: {
          seatPeriod: {
            where: {
              canOnlineBooked: true,
            },
            include: {
              seat: {
                select: {
                  amount: true,
                },
              },
            },
          },
        },
      });

      return res.status(200).send({
        message: 'Successfully get periods',
        result: periods,
      });
    } catch (error) {
      return res.status(500).send({
        message: (error as Error).message,
        result: null,
      });
    }
  };

  public static getPeriods = async (req: AuthRequest, res: ApiResponse<DatePeriodInfo[]>) => {
    const periods = await prismaClient.period.findMany({
      where: {
        startedAt: {
          gte: new Date(),
        },
        seatPeriod: {
          some: {
            canOnlineBooked: true,
          },
        },
      },
      include: {
        seatPeriod: {
          where: {
            canOnlineBooked: true,
          },
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
        amount: total,
        available,
      };
    });

    const datePeriodsWithAmount = periodsWithAmount.reduce<DatePeriodInfo[]>((prev, curr) => {
      const targets = prev.filter((d) => d.date.toDateString() === curr.periodStartedAt.toDateString());
      if (targets.length === 0) {
        const newDatePeriod: DatePeriodInfo = {
          date: new Date(curr.periodStartedAt.toDateString()),
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

      return [...prev.filter((d) => d.date.toDateString() !== curr.periodStartedAt.toDateString()), newTarget];
    }, []);

    res.status(200).send({
      message: 'Successfully get periods',
      result: datePeriodsWithAmount,
    });
  };
}

export default PeriodController;

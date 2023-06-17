import { object, date as dateSchema } from 'yup';
import { prismaClient } from '../helpers';
import { ApiResponse, AuthRequest } from '../types/shared';

class PeriodController {
  public static getPeriods = async (req: AuthRequest, res: ApiResponse) => {
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
              canBooked: false,
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
}

export default PeriodController;

import { RequestHandler } from 'express';
import { ApiResponse, AuthRequest } from '../types/shared';
import { dayjs, prismaClient } from '../helpers';
import { object, date as dateSchema } from 'yup';

const SeatStatus = ['RESERVED', 'AVAILABLE', 'OCCUPIED'] as const;

type ReservationRecord = {
  periodStartedAt: Date;
  periodEndedAt: Date;
  options?: { [key: string]: any };
};

type SeatAndReservationInfo = {
  id: string;
  seatNo: string;
  status: 'RESERVED' | 'AVAILABLE' | 'OCCUPIED';
  date: Date;
  currentReservation: ReservationRecord;
};

class SeatController {
  public static getAllSeatHandler: RequestHandler = async (req: AuthRequest, res: ApiResponse) => {
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

      const targetDate = date ? new Date(date) : new Date();
      const nextTargetDate = new Date(targetDate);

      nextTargetDate.setDate(nextTargetDate.getDate() + 1);

      // const periods = await prismaClient.period.findMany({
      //   where: {
      //     startedAt: {
      //       gte: targetDate,
      //       lte: nextTargetDate,
      //     },
      //   },
      // });

      const seats = await prismaClient.seat.findMany({
        select: {
          id: true,
          prefix: true,
          no: true,
        },
      });

      const result: SeatAndReservationInfo[] = seats.map((seat) => {
        const status = SeatStatus[Math.floor(Math.random() * SeatStatus.length)];
        const startedAt = dayjs(targetDate).set('hour', 12).set('minute', 0).set('second', 0);
        let currentReservation: ReservationRecord = {
          periodStartedAt: startedAt.toDate(),
          periodEndedAt: startedAt.add(2, 'hour').toDate(),
        };

        if (status !== 'AVAILABLE') {
          currentReservation = {
            ...currentReservation,
            options: {
              phone: '0912345678',
              adults: 3,
              children: 0,
            },
          };
        }

        return {
          id: seat.id,
          seatNo: seat.prefix + '-' + seat.no,
          status: status,
          date: new Date(targetDate),
          currentReservation,
        };
      });

      return res.status(200).send({
        message: 'Successfully get seats ',
        result,
      });
    } catch (error) {
      res.status(500).send({
        message: (error as Error).message,
        result: null,
      });
    }
  };
  public static getSeatHandler: RequestHandler = async (req: AuthRequest, res: ApiResponse) => {};
}

export default SeatController;

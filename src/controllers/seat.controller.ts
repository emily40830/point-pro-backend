import { RequestHandler } from 'express';
import { ApiResponse, AuthRequest } from '../types/shared';
import { dayjs, prismaClient } from '../helpers';
import { object, date as dateSchema } from 'yup';
import { ReservationType } from '@prisma/client';

const SeatStatus = ['RESERVED', 'AVAILABLE', 'OCCUPIED'] as const;

const DEFAULT_USER = {
  name: 'donttouch',
  email: 'canyouhearme@example.com',
  phone: '0987654321',
  adults: 1,
  gender: 0,
  remark: '',
  children: 0,
};

type SeatDetails = {
  id: string;
  seatNo: string;
  status: 'RESERVED' | 'AVAILABLE' | 'OCCUPIED';
  date: Date;
  history: ReservationRecord[];
};

type ReservationRecord = {
  // status: 'RESERVED' | 'AVAILABLE';
  periodId?: string;
  startedAt: Date;
  startOfMeal: Date | null;
  endOfMeal: Date | null;
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
          startedAt: startedAt.toDate(),
          // endedAt: startedAt.add(2, 'hour').toDate(),
          startOfMeal: startedAt.add(5, 'minute').toDate(),
          endOfMeal: startedAt.add(1.5, 'hour').toDate(),
        };

        if (status !== 'AVAILABLE') {
          currentReservation = {
            ...currentReservation,
            options: {
              name: 'donttouch',
              email: 'canyouhearme@example.com',
              phone: '0987654321',
              adults: 1,
              gender: 0,
              remark: '',
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
  public static getSeatHandler: RequestHandler = async (req: AuthRequest, res: ApiResponse) => {
    const { seatIdOrNo } = req.params;
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
    const { date } = querySchema.cast(req.query);
    const targetDateTime = date ?? new Date();

    const dateString = date.toLocaleDateString('zh-tw');

    const targetDate = date ? new Date(dateString) : new Date();
    const nextTargetDate = new Date(targetDate);
    nextTargetDate.setDate(nextTargetDate.getDate() + 1);

    try {
      // get seat by id or seat no
      let seatDetailsById = await prismaClient.seat.findUnique({
        where: {
          id: seatIdOrNo,
        },
      });
      if (!seatDetailsById) {
        const [prefix, no] = seatIdOrNo.split('-');
        seatDetailsById = await prismaClient.seat.findUnique({
          where: {
            seatNo: {
              prefix: prefix,
              no: Number(no),
            },
          },
        });
      }
      if (!seatDetailsById || seatDetailsById === null) {
        return res.status(404).json({
          message: `Can not found seat by ${seatIdOrNo}`,
          result: null,
        });
      }
      // get reservation log by seat
      // SeatPeriod() 當天所有時段的狀態 包含預約記錄
      const seatPeriods = await prismaClient.seatPeriod.findMany({
        where: {
          AND: [
            {
              seatId: seatDetailsById?.id,
            },
            {
              period: {
                startedAt: {
                  gte: targetDate,
                  lte: nextTargetDate,
                },
              },
            },
          ],
        },
        include: {
          period: {
            include: {
              ReservationSeat: {
                include: {
                  reservationLog: true,
                },
              },
            },
          },
        },
      });

      const reserved: ReservationRecord[] = seatPeriods.map((seatPeriod) => ({
        // status: !seatPeriod.canBooked && seatPeriod.period.ReservationSeat.length > 0 ? 'RESERVED' : 'AVAILABLE',
        periodId: seatPeriod.periodId,
        startedAt: seatPeriod.period.startedAt,
        startOfMeal:
          seatPeriod.period.ReservationSeat.length > 0
            ? seatPeriod.period.ReservationSeat[0].reservationLog.startOfMeal
            : null,
        endOfMeal:
          seatPeriod.period.ReservationSeat.length > 0
            ? seatPeriod.period.ReservationSeat[0].reservationLog.endOfMeal
            : null,
        options:
          seatPeriod.period.ReservationSeat.length > 0
            ? typeof seatPeriod.period.ReservationSeat[0].reservationLog.options === 'object' &&
              seatPeriod.period.ReservationSeat[0].reservationLog.options
              ? seatPeriod.period.ReservationSeat[0].reservationLog.options
              : undefined
            : undefined,
      }));

      const walkInSeating = await prismaClient.reservationLog.findMany({
        where: {
          type: ReservationType.WalkInSeating,
          startOfMeal: {
            gte: targetDate,
            lte: nextTargetDate,
          },
          bookedSeats: {
            some: {},
            every: {
              AND: [
                {
                  seatId: seatDetailsById?.id,
                },
              ],
            },
          },
        },
        include: {
          bookedSeats: {
            include: {
              seat: true,
              period: true,
            },
          },
        },
      });

      const walkInReserved: ReservationRecord[] = walkInSeating.map((walkIn) => ({
        startedAt: walkIn.startOfMeal || new Date(),
        startOfMeal: walkIn.startOfMeal,
        endOfMeal: walkIn.endOfMeal,
        options: typeof walkIn.options === 'object' && walkIn.options ? walkIn.options : DEFAULT_USER,
      }));

      let currentStatus: 'RESERVED' | 'AVAILABLE' | 'OCCUPIED' = 'AVAILABLE';
      for (let record of seatPeriods.filter(
        (seatPeriod) => !seatPeriod.canBooked && seatPeriod.period.ReservationSeat.length > 0,
      )) {
        const reservationLog = record.period.ReservationSeat[0];

        if (record.period.startedAt <= targetDateTime && record.period.endedAt >= targetDateTime) {
          if (reservationLog.reservationLog.startOfMeal !== null) {
            currentStatus = 'OCCUPIED';
          } else {
            currentStatus = 'RESERVED';
          }
        }
      }
      if (currentStatus === 'AVAILABLE') {
        for (let record of walkInSeating.filter((d) => d.bookedSeats.length > 0)) {
          // const reservationLog = record.period.ReservationSeat[0];

          if (record.startOfMeal !== null && record.startOfMeal <= targetDateTime && record.endOfMeal === null) {
            currentStatus = 'OCCUPIED';
          } else {
            currentStatus = 'RESERVED';
          }
        }
      }

      const result: SeatDetails = {
        id: seatDetailsById.id,
        seatNo: seatDetailsById.prefix + '-' + seatDetailsById.no,
        status: currentStatus,
        date: targetDateTime,
        history: [...reserved, ...walkInReserved],
      };

      res.status(200).json({
        message: 'get seat details successfully',
        result,
      });
    } catch (error) {
      res.status(500).json({
        message: (error as Error).message,
        result: null,
      });
    }
  };
}

export default SeatController;

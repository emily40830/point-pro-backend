import { RequestHandler } from 'express';
import { ApiResponse, AuthRequest } from '../types/shared';
import { ReservationInfo } from '../types/reservation';
import { dayjs, prismaClient } from '../helpers';
import { object, date as dateSchema, string } from 'yup';
import { Period, ReservationType } from '@prisma/client';

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
  history: ReservationInfo[];
};

type ReservationRecord = Pick<
  ReservationInfo,
  'startOfMeal' | 'endOfMeal' | 'options' | 'periodId' | 'periodStartedAt'
>;

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
      periodId: string().optional(),
    });

    try {
      await querySchema.validate(req.query);
    } catch (error) {
      return res.status(400).send({
        message: 'invalid query',
        result: null,
      });
    }

    try {
      const { date, periodId } = querySchema.cast(req.query);

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
      console.log(targetDate, nextTargetDate);

      let periods = await prismaClient.period.findMany({
        where: {
          startedAt: {
            gte: targetDate,
            lte: nextTargetDate,
          },
        },
      });

      let period: Period | undefined;
      if (periodId) {
        period = periods.find((period) => period.id === periodId);
      }

      if (!period) {
        let currPeriod = periods[0];
        console.log(currPeriod);
        for (let p of periods) {
          if (
            Math.abs(p.startedAt.valueOf() - targetDate.valueOf()) <
            Math.abs(currPeriod.startedAt.valueOf() - targetDate.valueOf())
          ) {
            currPeriod = p;
          }
        }
        period = currPeriod;
      }
      console.log('period', period);

      const reservationLogs = await prismaClient.reservationSeat.findMany({
        where: {
          periodId: {
            equals: period.id,
          },
        },
        include: {
          reservationLog: {
            include: {
              bookedSeats: {
                include: {
                  seat: true,
                },
              },
            },
          },
          seat: true,
        },
      });

      const result: SeatAndReservationInfo[] = seats.map((seat) => {
        const status = SeatStatus[Math.floor(Math.random() * SeatStatus.length)];
        const startedAt = dayjs(targetDate).set('hour', 12).set('minute', 0).set('second', 0);
        let currentReservation: ReservationRecord = {
          periodStartedAt: startedAt.toDate(),
          // endedAt: startedAt.add(2, 'hour').toDate(),
          startOfMeal: startedAt.add(5, 'minute').toDate(),
          endOfMeal: startedAt.add(1.5, 'hour').toDate(),
          options: {},
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

      res.status(200).json({
        message: 'Successfully get seats ',
        result,
      });
    } catch (error) {
      res.status(500).json({
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
      // SeatPeriod 當天所有時段的狀態 包含預約記錄
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
      const reservationLogs = await prismaClient.reservationLog.findMany({
        where: {
          bookedSeats: {
            some: {
              seatId: {
                equals: seatDetailsById.id,
              },
            },
            every: {
              period: {
                startedAt: {
                  lte: nextTargetDate,
                  gte: targetDate,
                },
              },
            },
          },
        },
        include: {
          bookedSeats: {
            include: {
              seat: true,
            },
          },
        },
      });

      const reserved: ReservationInfo[] = seatPeriods
        .filter((s) => s.period.ReservationSeat.length > 0)
        .map((seatPeriod) => {
          const currentReservationLog = seatPeriod.period.ReservationSeat[0].reservationLog;

          const seats =
            reservationLogs
              .find((r) => r.id === currentReservationLog.id)
              ?.bookedSeats.map((s) => ({
                id: s.seat.id,
                seatNo: s.seat.prefix + '-' + s.seat.no,
                amount: s.seat.amount,
              })) || [];
          return {
            // status: !seatPeriod.canBooked && seatPeriod.period.ReservationSeat.length > 0 ? 'RESERVED' : 'AVAILABLE',
            id: currentReservationLog.id,
            reservedAt: currentReservationLog.reservedAt,
            type: currentReservationLog.type,
            periodId: seatPeriod.periodId,
            periodStartedAt: seatPeriod.period.startedAt,
            periodEndedAt: seatPeriod.period.endedAt,
            startOfMeal: currentReservationLog.startOfMeal,
            endOfMeal: currentReservationLog.endOfMeal,
            options:
              typeof currentReservationLog.options === 'object' && currentReservationLog.options
                ? currentReservationLog.options
                : undefined,
            seats,
          };
        });

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

      const walkInReserved: ReservationInfo[] = walkInSeating.map((walkIn) => ({
        id: walkIn.id,
        reservedAt: walkIn.reservedAt,
        type: walkIn.type,
        startOfMeal: walkIn.startOfMeal,
        endOfMeal: walkIn.endOfMeal,
        options: typeof walkIn.options === 'object' && walkIn.options ? walkIn.options : DEFAULT_USER,
        seats: walkIn.bookedSeats.map((s) => ({
          id: s.seat.id,
          seatNo: s.seat.prefix + '-' + s.seat.no,
          amount: s.seat.amount,
        })),
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

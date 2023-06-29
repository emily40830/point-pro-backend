import { RequestHandler } from 'express';
import { ApiResponse, AuthRequest } from '../types/shared';
import { ReservationInfo } from '../types/reservation';
import { formatReservationOptions, getDefaultDate, prismaClient } from '../helpers';
import { object, date as dateSchema, string } from 'yup';
import { Period, ReservationLog, ReservationSeat, ReservationType, Seat, SeatPeriod } from '@prisma/client';

export const SeatStatus = {
  RESERVED: 'RESERVED',
  AVAILABLE: 'AVAILABLE',
  OCCUPIED: 'OCCUPIED',
};

export type SeatStatus = (typeof SeatStatus)[keyof typeof SeatStatus];

type SeatDetails = {
  id: string;
  seatNo: string;
  date: Date;
  periods: (Pick<Period, 'id' | 'startedAt' | 'endedAt'> & {
    status: SeatStatus;
    reservation: ReservationInfo | null;
  })[];
};

type SeatInfo = {
  id: string;
  seatNo: string;
  status: SeatStatus;
  date: Date;
  period: Pick<Period, 'id' | 'startedAt' | 'endedAt'>;
  currentReservation: Pick<
    ReservationInfo,
    'id' | 'reservedAt' | 'type' | 'startOfMeal' | 'endOfMeal' | 'options'
  > | null;
};

class SeatController {
  public static getAllSeatHandler: RequestHandler = async (req: AuthRequest, res: ApiResponse) => {
    const querySchema = object({
      date: dateSchema().optional(),
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
      let period: Period | null = null;
      const targetDate = date ? new Date(date) : getDefaultDate();

      if (!date && periodId) {
        period = await prismaClient.period.findUnique({
          where: {
            id: periodId,
          },
        });
        if (!period) {
          return res.status(404).json({
            message: 'Can not found period from given periodId',
            result: null,
          });
        }
      } else {
        const nextTargetDate = new Date(targetDate);

        nextTargetDate.setDate(nextTargetDate.getDate() + 1);

        console.log(targetDate, nextTargetDate);

        let periods = await prismaClient.period.findMany({
          where: {
            startedAt: {
              gte: targetDate,
              lte: nextTargetDate,
            },
          },
        });

        if (periodId) {
          period = periods.find((period) => period.id === periodId) || null;
          if (period === null) {
            return res.status(400).json({
              message: 'date and periodId not match',
              result: null,
            });
          }
        } else {
          let currPeriod: Period = periods[0];
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
      }

      const seats = await prismaClient.seat.findMany({
        select: {
          id: true,
          prefix: true,
          no: true,
        },
      });

      const targetPeriod = period;

      const reservationLogs = await prismaClient.reservationSeat.findMany({
        where: {
          periodId: {
            equals: targetPeriod.id,
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

      const result: SeatInfo[] = seats.map((seat) => {
        const reservations = reservationLogs.filter((reservation) => reservation.seatId === seat.id);
        let currentReservation: SeatInfo['currentReservation'] | null = null;
        if (reservations.length > 0) {
          const current = reservationLogs[0];
          currentReservation = {
            id: current.reservationLog.id,
            type: current.reservationLog.type,
            reservedAt: current.reservationLog.reservedAt,
            startOfMeal: current.reservationLog.startOfMeal,
            endOfMeal: current.reservationLog.endOfMeal,
            options: formatReservationOptions(current.reservationLog.options),
          };
        }
        const seatStatus = currentReservation
          ? currentReservation.startOfMeal !== null
            ? SeatStatus.OCCUPIED
            : SeatStatus.RESERVED
          : SeatStatus.AVAILABLE;

        return {
          id: seat.id,
          seatNo: seat.prefix + '-' + seat.no,
          status: seatStatus,
          date: targetDate,
          period: { id: targetPeriod.id, startedAt: targetPeriod.startedAt, endedAt: targetPeriod.endedAt },
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
      date: dateSchema().optional(),
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
    const targetDateTime = date ?? getDefaultDate();

    const targetDate = targetDateTime;
    const nextTargetDate = new Date(targetDate);
    nextTargetDate.setDate(nextTargetDate.getDate() + 1);
    let seatDetails:
      | (Seat & {
          periods: (SeatPeriod & {
            period: Period;
          })[];
        })
      | null = null;

    try {
      seatDetails = await prismaClient.seat.findUnique({
        where: {
          id: seatIdOrNo,
        },
        include: {
          periods: {
            where: {
              period: {
                startedAt: {
                  gte: targetDate,
                  lte: nextTargetDate,
                },
              },
            },
            include: {
              period: true,
            },
          },
        },
      });
    } catch (error) {
      const [prefix, no] = seatIdOrNo.split('-');
      seatDetails = await prismaClient.seat.findUnique({
        where: {
          seatNo: {
            prefix: prefix,
            no: Number(no),
          },
        },
        include: {
          periods: {
            where: {
              period: {
                startedAt: {
                  gte: targetDate,
                  lte: nextTargetDate,
                },
              },
            },
            include: {
              period: true,
            },
          },
        },
      });
    }

    if (!seatDetails) {
      return res.status(404).json({
        message: `Can not found seat by ${seatIdOrNo}`,
        result: null,
      });
    }
    const periodIds = seatDetails.periods.map((period) => period.periodId);

    try {
      // get seat by id or seat no

      const reservationSeats = await prismaClient.reservationSeat.findMany({
        where: {
          seatId: seatDetails.id,
          periodId: {
            in: periodIds,
          },
        },
      });

      const reservationLogs = await prismaClient.reservationLog.findMany({
        where: {
          id: {
            in: reservationSeats.map((seat) => seat.reservationLogId),
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

      const allPeriods: SeatDetails['periods'] = seatDetails.periods.map((seatPeriod) => {
        const reservationLog =
          reservationLogs.find(
            (reservationLog) =>
              reservationLog.bookedSeats && reservationLog.bookedSeats[0].periodId === seatPeriod.periodId,
          ) || null;

        const reservedSeats = reservationLog
          ? reservationLog.bookedSeats.map((bookSeat) => ({
              id: bookSeat.seatId,
              seatNo: bookSeat.seat.prefix + '-' + bookSeat.seat.no,
              amount: bookSeat.seat.amount,
            }))
          : [];
        const currentStatus = reservationLog
          ? reservationLog.startOfMeal
            ? SeatStatus.OCCUPIED
            : SeatStatus.RESERVED
          : SeatStatus.AVAILABLE;
        return {
          id: seatPeriod.periodId,
          startedAt: seatPeriod.period.startedAt,
          endedAt: seatPeriod.period.endedAt,
          status: currentStatus,
          reservation: reservationLog && {
            id: reservationLog.id,
            reservedAt: reservationLog.reservedAt,
            type: reservationLog.type,
            startOfMeal: reservationLog.startOfMeal,
            endOfMeal: reservationLog.endOfMeal,
            options: formatReservationOptions(reservationLog.options),
            seats: reservedSeats,
          },
        };
      });

      const result: SeatDetails = {
        id: seatDetails.id,
        seatNo: seatDetails.prefix + '-' + seatDetails.no,
        date: targetDateTime,
        periods: allPeriods,
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

import { array, date, number, object, string } from 'yup';
import { dayjs, prismaClient } from '../helpers';
import { ApiResponse, AuthRequest } from '../types/shared';
import { Period, Prisma, ReservationType, Seat, SeatPeriod, SeatSibling } from '@prisma/client';

class ReservationController {
  public static createReservationHandler = async (req: AuthRequest, res: ApiResponse) => {
    const inputSchema = object({
      type: string().required().oneOf(['OnlineBooking', 'PhoneBooking']),
      options: object().default(() => {}),
      amount: number().min(1).required(),
      // seats: array(string().required()).optional().default([]),
      periodStartedAt: date().required(),
    });

    try {
      await inputSchema.validate(req.body);
    } catch (error) {
      res.status(400).send({
        message: (error as Error).message,
        result: null,
      });
    }
    const { type, options, amount, periodStartedAt } = inputSchema.cast(req.body);
    // const userRole = req.auth.role;

    // if (userRole !== 'MERCHANT' && seats.length > 0) {
    //   return res.status(403).send({
    //     message: 'Invalid input',
    //     result: null,
    //   });
    // }

    const period = await prismaClient.period.findFirst({
      where: {
        startedAt: dayjs(periodStartedAt).toISOString(),
      },
    });

    if (!period) {
      res.status(400).send({
        message: `Can not found period started at ${periodStartedAt}`,
        result: null,
      });
    }

    try {
      let targetSeatPeriod:
        | (SeatPeriod & {
            period: Period;
            seat: Seat & {
              siblings: (SeatSibling & {
                nextSeat: Seat;
              })[];
            };
          })
        | undefined;

      const seatPeriods = await prismaClient.seatPeriod.findMany({
        where: {
          periodId: period?.id,
          canOnlineBooked: true,
          canBooked: true,
        },
        include: {
          seat: { include: { siblings: { include: { nextSeat: true } } } },
          period: true,
        },
      });

      if (amount === 5 || amount === 6 || amount > 10) {
        res.status(400).send({
          message: 'people amount not supported',
          result: null,
        });
      }

      if (amount < 3) {
        const twoSeats = seatPeriods.filter((seatPeriod) => {
          return seatPeriod.seat.amount === 2;
        });

        if (twoSeats.length < 1) {
          res.status(403).send({
            message: 'There is no suitable seat, please try other period',
            result: null,
          });
        }

        targetSeatPeriod = twoSeats[0];

        const createReservationLog: Prisma.ReservationLogCreateInput = {
          reservedAt: new Date(),
          type: type as ReservationType,
          options,
          bookedSeats: {
            create: [
              {
                seatId: targetSeatPeriod.seatId,
                periodId: targetSeatPeriod.periodId,
              },
            ],
          },
        };

        const updateSeatPeriod: Prisma.SeatPeriodUpdateInput = {
          canBooked: { set: false },
        };

        await prismaClient.$transaction([
          prismaClient.reservationLog.create({ data: createReservationLog }),
          prismaClient.seatPeriod.update({ data: updateSeatPeriod, where: { id: targetSeatPeriod.id } }),
        ]);
      }

      if (amount === 3 || amount === 4) {
        const twoSeatPeriods = seatPeriods.filter((seatPeriod) => {
          const nextSeats = seatPeriod.seat.siblings;
          return nextSeats
            ? seatPeriods.filter((seatPeriod) => nextSeats.length > 0 && seatPeriod.seatId === nextSeats[0].nextSeatId)
            : false;
        });

        if (twoSeatPeriods.length < 1) {
          res.status(403).send({
            message: 'There is no suitable seat, please try other period',
            result: null,
          });
        }

        targetSeatPeriod = twoSeatPeriods[0];

        const createReservationLog: Prisma.ReservationLogCreateInput = {
          reservedAt: new Date(),
          type: type as ReservationType,
          options,
          bookedSeats: {
            createMany: {
              data: [
                {
                  seatId: targetSeatPeriod.seatId,
                  periodId: targetSeatPeriod.periodId,
                },
                {
                  seatId: targetSeatPeriod.seat.siblings[0].nextSeatId,
                  periodId: targetSeatPeriod.periodId,
                },
              ],
              skipDuplicates: true,
            },
          },
        };

        const nextSeatPeriod = await prismaClient.seatPeriod.findFirst({
          where: {
            seatId: targetSeatPeriod.seat.siblings[0].nextSeatId,
            periodId: targetSeatPeriod.periodId,
          },
        });

        if (!nextSeatPeriod) {
          res.status(403).send({
            message: 'Can not booked sutiable seat',
            result: null,
          });
        }

        const updateSeatPeriod: Prisma.SeatPeriodUpdateInput = {
          canBooked: { set: false },
        };

        console.log(JSON.stringify(createReservationLog));

        await prismaClient.$transaction([
          prismaClient.reservationLog.create({ data: createReservationLog }),
          prismaClient.seatPeriod.update({ data: updateSeatPeriod, where: { id: targetSeatPeriod.id } }),
          prismaClient.seatPeriod.update({ data: updateSeatPeriod, where: { id: nextSeatPeriod?.id } }),
        ]);
      }

      if (amount < 11 && amount > 6) {
        console.log('7 ~ 10');
        const targetSeatPeriods = seatPeriods.filter((seatPeriod) => {
          return seatPeriod.seat.amount === 10;
        });

        if (targetSeatPeriods.length < 1) {
          res.status(403).send({
            message: 'There is no suitable seat, please try other period',
            result: null,
          });
        }

        targetSeatPeriod = targetSeatPeriods[0];

        const createReservationLog: Prisma.ReservationLogCreateInput = {
          // id: reservationLogId,
          reservedAt: new Date(),
          type: type as ReservationType,
          startOfMeal: null,
          endOfMeal: null,
          options,
          bookedSeats: {
            create: [
              {
                seatId: targetSeatPeriod.seatId,
                periodId: targetSeatPeriod.periodId,
              },
            ],
          },
        };

        const updateSeatPeriod: Prisma.SeatPeriodUpdateInput = {
          canBooked: { set: false },
        };

        await prismaClient.$transaction([
          prismaClient.reservationLog.create({ data: createReservationLog }),
          prismaClient.seatPeriod.update({ data: updateSeatPeriod, where: { id: targetSeatPeriod.id } }),
        ]);
      }

      const reservation = await prismaClient.reservationSeat.findFirst({
        where: {
          seatId: targetSeatPeriod?.seatId,
          periodId: targetSeatPeriod?.periodId,
        },
        include: {
          reservationLog: true,
          seat: true,
          period: true,
        },
      });

      if (reservation && reservation.reservationLog && reservation.period && reservation.seat) {
        const result = {
          id: reservation.reservationLogId,
          reservedAt: reservation.reservationLog.reservedAt,
          type: reservation.reservationLog.type,
          options: reservation.reservationLog.options,
          periodStartedAt: reservation.period.startedAt,
          periodEndedAt: reservation.period.endedAt,
          seats: [
            {
              id: reservation.seatId,
              seatNo: reservation.seat.prefix + '-' + reservation.seat.no,
              amount: reservation.seat.amount,
            },
          ],
        };
        res.status(201).send({
          message: 'Successfully create reservation.',
          result,
        });
      }

      throw new Error('Create reservation failed.');
    } catch (error) {
      res.status(500).send({
        message: (error as Error).message,
        result: null,
      });
    }
  };
  public static getReservationsHandler = async (req: AuthRequest, res: ApiResponse) => {
    const userRole = req.auth.role;
    if ('reservationLogId' in req.auth) {
      // do something
    }
    if (userRole != 'USER') {
      let reservationLogs = await prismaClient.reservationLog.findMany({ take: 100, include: { bookedSeats: true } });
      res.status(200).send({
        message: 'successfully get reservation logs',
        result: reservationLogs,
      });
    }

    try {
      const reservations = await prismaClient.reservationLog.findMany({});

      return res.status(200).send({
        message: 'successfully get reservations',
        result: reservations,
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).send({
          message: error.message,
          result: null,
        });
      }
    }
  };

  public static getReservationDetailsHandler = () => {};
}

export default ReservationController;

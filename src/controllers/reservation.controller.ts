import { array, date, number, object, string } from 'yup';
import { dayjs, prismaClient } from '../helpers';
import { ApiResponse, AuthRequest } from '../types/shared';

class ReservationController {
  public static createReservationHandler = async (req: AuthRequest, res: ApiResponse) => {
    const inputSchema = object({
      type: string().required().oneOf(['OnlineBooking', 'PhoneBooking']),
      options: object().default(() => {}),
      amount: number().min(1).required(),
      seats: array(string().required()).optional().default([]),
      periodStartedAt: date().required(),
    });

    try {
      await inputSchema.validate(req.body);
    } catch (error) {
      return res.status(400).send({
        message: (error as Error).message,
        result: null,
      });
    }
    const { type, options, amount, seats, periodStartedAt } = inputSchema.cast(req.body);
    const userRole = req.auth.role;

    if (userRole !== 'MERCHANT' && seats.length > 0) {
      return res.status(403).send({
        message: 'Invalid input',
        result: null,
      });
    }

    const period = await prismaClient.period.findFirst({
      where: {
        startedAt: dayjs(periodStartedAt).toISOString(),
      },
    });
    if (period == null) {
      return res.status(400).send({
        message: `Can not found period started at ${periodStartedAt}`,
        result: null,
      });
    }

    const reservedSeats = [];

    const seatPeriods = await prismaClient.seatPeriod.findMany({
      where: {
        periodId: period.id,
        canOnlineBooked: true,
        canBooked: true,
      },
      include: {
        seat: { include: { siblings: { include: { nextSeat: true } } } },
        period: true,
      },
    });

    if (amount > 7)
      res.status(200).send({
        message: 'get seat periods',
        result: seatPeriods,
      });

    // const createReservation: Prisma.ReservationLogCreateInput = {
    //   reservedAt: new Date(),
    //   type: type as ReservationType,
    //   options,
    // };
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

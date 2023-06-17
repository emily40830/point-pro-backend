import { array, date, number, object, string } from 'yup';
import { prismaClient } from '../helpers';
import { ApiResponse, AuthRequest } from '../types/shared';
import { Prisma, ReservationType } from '@prisma/client';

class ReservationController {
  public static createReservation = async (req: AuthRequest, res: ApiResponse) => {
    const inputSchema = object({
      type: string().required().oneOf(['OnlineBooking', 'PhoneBooking']),
      options: object().default(() => {}),
      amount: number().min(1).required(),
      seats: array(string().required()).required(),
      periodDate: date().required(),
      periodTime: date().required(),
    });

    try {
      await inputSchema.validate(req.body);
    } catch (error) {
      return res.status(400).send({
        message: (error as Error).message,
        result: null,
      });
    }
    const { type, options, seats, periodDate, periodTime } = inputSchema.cast(req.body);
    const userRole = req.auth.role;

    if (userRole !== 'MERCHANT' && seats.length > 0) {
      return res.status(403).send({
        message: 'Invalid input',
        result: null,
      });
    }

    if (seats.length === 0) {
    }

    const createReservation: Prisma.ReservationLogCreateInput = {
      reservedAt: new Date(),
      type: type as ReservationType,
      options,
    };
  };
  public static getReservations = async (req: AuthRequest, res: ApiResponse) => {
    const userRole = req.auth.role;
    if ('reservationLogId' in req.auth) {
      // do something
    }
    if (userRole != 'USER') {
      let reservationLogs = await prismaClient.reservationLog.findMany({ take: 100, include: { bookedSeat: true } });
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

  public static getReservationDetails = () => {};
}

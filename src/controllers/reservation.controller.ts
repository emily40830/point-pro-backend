import { prismaClient } from '../helpers';
import { ApiResponse, AuthRequest } from '../types/shared';

class ReservationController {
  public static createReservation = () => {
    // validate input
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
      let meal = await prismaClient.reservationLog.findMany({});

      return res.status(200).send({
        message: 'successfully get meals',
        result: meal,
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

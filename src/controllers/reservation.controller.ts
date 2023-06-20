import { date, number, object, string } from 'yup';
import { prismaClient } from '../helpers';
import { ApiResponse, AuthRequest } from '../types/shared';

import { AuthService, ReservationService } from '../services';

// id: reservation.id,
//           reservedAt: reservation.reservedAt,
//           type: reservation.type,
//           options: reservation.options,
//           periodStartedAt: reservation.bookedSeats[0].period.startedAt,
//           periodEndedAt: reservation.bookedSeats[0].period.endedAt,
//           seats: reservation.bookedSeats.map((bookedSeat) => ({
//             id: bookedSeat.seatId,
//             seatNo: bookedSeat.seat.prefix + '-' + bookedSeat.seat.no,
//             amount: bookedSeat.seat.amount,
//           })),

type PartialSeat = {
  id: string;
  seatNo: string;
  amount: number;
};

type CreateReservation = {
  id: string;
  reservedAt: Date;
  options: { [key: string]: any };
  periodStartedAt: Date;
  periodEndedAt: Date;
  token: string;
  seats: PartialSeat[];
};

class ReservationController {
  public static createReservationHandler = async (req: AuthRequest, res: ApiResponse<CreateReservation>) => {
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

    const { options, amount, periodStartedAt } = inputSchema.cast(req.body);
    const { status, reservationLogId, details } = await ReservationService.createOnlineBookingRecord(
      periodStartedAt,
      amount,
      options,
    );

    if (reservationLogId) {
      const reservation = await prismaClient.reservationLog.findUnique({
        where: {
          id: reservationLogId,
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

      if (reservation && reservation.bookedSeats) {
        const result = {
          id: reservation.id,
          reservedAt: reservation.reservedAt,
          type: reservation.type,
          options: typeof reservation.options === 'object' && reservation.options ? reservation.options : {},
          periodStartedAt: reservation.bookedSeats[0].period.startedAt,
          periodEndedAt: reservation.bookedSeats[0].period.endedAt,
          seats: reservation.bookedSeats.map((bookedSeat) => ({
            id: bookedSeat.seatId,
            seatNo: bookedSeat.seat.prefix + '-' + bookedSeat.seat.no,
            amount: bookedSeat.seat.amount,
          })),
        };

        const token = await AuthService.generateReservationToken(reservation.id);

        res.status(201).send({
          message: 'Successfully Create Reservation',
          result: { ...result, token },
        });
      }
    } else {
      res.status(status).send({
        message: details,
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

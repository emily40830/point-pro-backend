import { date, number, object, string } from 'yup';
import { prismaClient } from '../helpers';
import { ApiResponse, AuthRequest } from '../types/shared';

import { AuthService, ReservationService } from '../services';
import { ReservationType } from '@prisma/client';

type ReservationInfo = {
  id: string;
  reservedAt: Date;
  type: ReservationType;
  options: { [key: string]: any };
  periodStartedAt: Date;
  periodEndedAt: Date;
  startOfMeal: Date | null;
  endOfMeal: Date | null;
  seats: PartialSeat[];
};

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
      res.status(400).json({
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

        res.status(201).json({
          message: 'Successfully Create Reservation',
          result: { ...result, token },
        });
      }
    } else {
      res.status(status).json({
        message: details,
        result: null,
      });
    }
  };
  public static getReservationsHandler = async (req: AuthRequest, res: ApiResponse) => {
    try {
      const reservations = await prismaClient.reservationLog.findMany({
        include: {
          bookedSeats: {
            include: {
              seat: true,
              period: true,
            },
          },
        },
      });

      // console.log(reservations);

      const result: ReservationInfo[] = reservations
        .filter((reservation) => reservation.bookedSeats.length > 0)
        .map((reservation) => {
          console.log(reservation.bookedSeats[0]);
          return {
            id: reservation.id,
            reservedAt: reservation.reservedAt,
            type: reservation.type,
            options: typeof reservation.options === 'object' && reservation.options ? reservation.options : {},
            periodStartedAt: reservation.bookedSeats[0].period.startedAt,
            periodEndedAt: reservation.bookedSeats[0].period.endedAt,
            startOfMeal: reservation.startOfMeal,
            endOfMeal: reservation.endOfMeal,
            seats: reservation.bookedSeats.map((seatRelation) => ({
              id: seatRelation.seat.id,
              seatNo: seatRelation.seat.prefix + '-' + seatRelation.seat.no,
              amount: seatRelation.seat.amount,
            })),
          };
        });

      return res.status(200).json({
        message: 'successfully get reservations',
        result,
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          message: error.message,
          result: null,
        });
      }
    }
  };
  public static getReservationDetailsHandler = async (req: AuthRequest, res: ApiResponse) => {
    const { reservationId } = req.params;
    try {
      const reservation = await prismaClient.reservationLog.findUnique({
        where: { id: reservationId },
        include: {
          bookedSeats: {
            include: {
              seat: true,
              period: true,
            },
          },
        },
      });

      const result: ReservationInfo | null = reservation && {
        id: reservation.id,
        reservedAt: reservation.reservedAt,
        type: reservation.type,
        options: typeof reservation.options === 'object' && reservation.options ? reservation.options : {},
        periodStartedAt: reservation.bookedSeats[0].period.startedAt,
        periodEndedAt: reservation.bookedSeats[0].period.endedAt,
        startOfMeal: reservation.startOfMeal,
        endOfMeal: reservation.endOfMeal,
        seats: reservation.bookedSeats.map((seatRelation) => ({
          id: seatRelation.seat.id,
          seatNo: seatRelation.seat.prefix + '-' + seatRelation.seat.no,
          amount: seatRelation.seat.amount,
        })),
      };

      return res.status(200).json({
        message: 'successfully get reservation',
        result,
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          message: error.message,
          result: null,
        });
      }
    }
  };
  public static searchReservationHandler = async (req: AuthRequest, res: ApiResponse) => {};
}

export default ReservationController;

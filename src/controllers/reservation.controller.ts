import { array, date, number, object, string } from 'yup';
import { prismaClient } from '../helpers';
import { ApiResponse, AuthRequest } from '../types/shared';

import { AuthService, ReservationService } from '../services';

import { v4 as uuidv4 } from 'uuid';
import { CreateRecord, CreateReservation, ReservationInfo } from '../types/reservation';

class ReservationController {
  public static createReservationHandler = async (req: AuthRequest, res: ApiResponse<CreateReservation>) => {
    let isMerchant = false;
    if (req.auth && req.auth.role !== 'USER') {
      isMerchant = true;
    }
    const inputSchema = object({
      type: string().required().oneOf(['OnlineBooking', 'PhoneBooking', 'WalkInSeating']),
      options: object().default(() => {}),
      amount: number().min(1).required(),
      seats: array(string().required()).optional().default([]),
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

    const { type, options, amount, seats, periodStartedAt } = inputSchema.cast(req.body);

    if (isMerchant && !seats) {
      res.status(400).json({
        message: 'Invalid Seats',
        result: null,
      });
    }
    const reservationLogId = uuidv4();
    let createReservationResult: CreateRecord = {
      status: 0,
      details: '',
      reservationLogId,
    };
    switch (type) {
      case 'OnlineBooking':
        createReservationResult = await ReservationService.createOnlineBookingRecord(
          reservationLogId,
          periodStartedAt,
          amount,
          options,
        );
      case 'PhoneBooking':
        createReservationResult = await ReservationService.createPhoneBookingRecord(
          reservationLogId,
          periodStartedAt,
          seats,
          options,
        );
    }

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
      res.status(createReservationResult.status).json({
        message: createReservationResult.details,
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
  public static searchReservationHandler = async (req: AuthRequest, res: ApiResponse) => {
    const querySchema = object({
      query: string().required(),
    });
  };
}

export default ReservationController;

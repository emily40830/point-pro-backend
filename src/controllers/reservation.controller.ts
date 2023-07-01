import { date, number, object, string } from 'yup';
import { getDateOnly, ignoreUndefined, prismaClient } from '../helpers';
import { ApiResponse, AuthRequest } from '../types/shared';

import { AuthService, PeriodService, ReservationService } from '../services';

import { v4 as uuidv4 } from 'uuid';
import { CreateRecord, CreateReservation, ReservationInfo, UpdateReservation } from '../types/reservation';
import { Prisma, ReservationType } from '@prisma/client';

class ReservationController {
  public static createReservationHandler = async (req: AuthRequest, res: ApiResponse<CreateReservation>) => {
    // let isMerchant = false;
    // if (req.auth && req.auth.role !== 'USER') {
    //   isMerchant = true;
    // }
    const inputSchema = object({
      type: string().required().oneOf(['OnlineBooking', 'PhoneBooking', 'WalkInSeating']),
      options: object().default(() => {}),
      amount: number().min(1).required(),
      periodStartedAt: date().required(),
    });

    try {
      await inputSchema.validate(req.body);
    } catch (error) {
      return res.status(400).json({
        message: (error as Error).message,
        result: null,
      });
    }

    const { type, options, amount, periodStartedAt } = inputSchema.cast(req.body);

    // if (isMerchant && !seats) {
    //   res.status(400).json({
    //     message: 'Invalid Seats',
    //     result: null,
    //   });
    // }
    console.log(type, options, amount, periodStartedAt);

    const reservationLogId = uuidv4();
    let createReservationResult: CreateRecord = {
      status: 0,
      details: '',
      reservationLogId,
    };
    createReservationResult = await ReservationService.createAutoReservedSeatsRecord(
      type as ReservationType,
      reservationLogId,
      periodStartedAt,
      amount,
      options,
    );
    console.log('createReservationResult', createReservationResult);

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

        await PeriodService.delPeriods();

        res.status(201).json({
          message: 'CREATE_RESERVATION',
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
    const querySchema = object({
      date: date()
        .optional()
        .default(() => new Date()),
    });
    try {
      await querySchema.validate(req.query);
    } catch (error) {
      return res.status(400).json({
        message: 'invalid date format',
        result: null,
      });
    }

    try {
      const { date } = await querySchema.cast(req.query);
      let nextTargetDate = getDateOnly(date);
      nextTargetDate.setDate(nextTargetDate.getDate() + 1);

      console.log(date, nextTargetDate);

      const reservations = await prismaClient.reservationLog.findMany({
        where: {
          bookedSeats: {
            every: {
              period: {
                startedAt: {
                  gte: date,
                  lte: nextTargetDate,
                },
              },
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

      // console.log(reservations);

      const sortedReservations = reservations
        .filter((reservation) => reservation.bookedSeats.length > 0)
        .sort((a, b) => {
          const startedAtA = a.bookedSeats.length > 0 ? a.bookedSeats[0].period.startedAt.valueOf() : 0;
          const startedAtB = b.bookedSeats.length > 0 ? b.bookedSeats[0].period.startedAt.valueOf() : 0;

          return startedAtA - startedAtB;
        });

      const result: ReservationInfo[] = sortedReservations.map((reservation) => {
        // console.log(reservation.bookedSeats[0]);
        return {
          id: reservation.id,
          reservedAt: reservation.reservedAt,
          type: reservation.type,
          status:
            reservation.startOfMeal && reservation.endOfMeal
              ? 'COMPLETED'
              : reservation.startOfMeal
              ? 'IN_USE'
              : 'NOT_ATTENDED',
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
      // result.sort((a, b) => a.periodStartedAt?.valueOf() || 0 - (b.periodEndedAt?.valueOf() || 1));

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
    const { reservationLogId } = req.params;
    try {
      const reservation = await prismaClient.reservationLog.findUnique({
        where: { id: reservationLogId },
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
        status:
          reservation.startOfMeal && reservation.endOfMeal
            ? 'COMPLETED'
            : reservation.startOfMeal
            ? 'IN_USE'
            : 'NOT_ATTENDED',
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
  public static updateReservationHandler = async (req: AuthRequest, res: ApiResponse<UpdateReservation>) => {
    const inputSchema = object({
      options: object().optional(),
      startOfMeal: date().optional(),
      endOfMeal: date().optional(),
    });
    const { reservationLogId } = req.params;

    try {
      await inputSchema.validate(req.body);
    } catch (error) {
      res.status(400).json({
        message: (error as Error).message,
        result: null,
      });
    }
    const { options, startOfMeal, endOfMeal } = inputSchema.cast(req.body);

    try {
      const reservationLog = await prismaClient.reservationLog.findUniqueOrThrow({
        where: { id: reservationLogId },
      });

      const newReservation: Prisma.ReservationLogUpdateInput = {
        options:
          options === undefined
            ? reservationLog.options
            : typeof reservationLog.options === 'object'
            ? { ...reservationLog.options, ...options }
            : ignoreUndefined(options, reservationLog.options),
        startOfMeal: ignoreUndefined(startOfMeal, reservationLog.startOfMeal),
        endOfMeal: ignoreUndefined(endOfMeal, reservationLog.endOfMeal),
      };

      const updatedReservation = await prismaClient.reservationLog.update({
        where: {
          id: reservationLogId,
        },
        data: newReservation,
      });
      return res.status(200).json({
        message: 'UPDATE_RESERVATION',
        result: {
          id: updatedReservation.id,
          options: updatedReservation.options,
          startOfMeal: updatedReservation.startOfMeal,
          endOfMeal: updatedReservation.endOfMeal,
        },
      });
    } catch (error) {
      res.status(400).json({
        message: (error as Error).message,
        result: null,
      });
    }
  };
}

export default ReservationController;

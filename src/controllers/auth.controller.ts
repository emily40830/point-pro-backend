import { RequestHandler } from 'express';
import { ApiResponse } from '../types/shared';
import { object, string } from 'yup';
import { AuthService } from '../services';
import { prismaClient } from '../helpers';

class AuthController {
  public static generateTokenHandler: RequestHandler = async (req, res: ApiResponse) => {
    // validate input
    const inputSchema = object({
      reservationLogId: string().uuid().required().lowercase(),
    });

    try {
      await inputSchema.validate(req.body);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).send({
          message: `invalid input:${error.message}`,
          result: null,
        });
      }
    }

    const { reservationLogId } = inputSchema.cast(req.body);

    const reservation = await prismaClient.reservationSeat.findFirst({
      where: {
        id: reservationLogId,
      },
      include: {
        reservationLog: true,
        seatPeriod: true,
      },
    });

    if (reservation) {
      const { reservationLog, seatPeriod } = reservation;

      const reservationType = reservationLog?.type;

      const seatAndPeriod = await prismaClient.seatPeriod.findUnique({
        where: {
          id: seatPeriod?.id,
        },
        include: {
          seat: true,
          period: true,
        },
      });

      const seatNo = seatAndPeriod?.seat.prefix + '-' + seatAndPeriod?.seat.no.toString().padStart(2, '0');
      const startTime = new Date();
      const periodStartTime = seatAndPeriod?.startedAt;
      const periodEndTime = seatAndPeriod?.endedAt;

      const token = AuthService.signJWT({
        seatNo,
        reservationType,
        startTime,
        reservationLogId,
        periodStartTime,
        periodEndTime,
      });
      res.status(200).send({
        message: 'successfully create token',
        result: {
          token,
        },
      });
    }
  };
  public static registerHandler: RequestHandler = async (req, res: ApiResponse) => {
    // validate input
    const inputSchema = object({
      account: string().required().lowercase(),
      email: string().email().required().lowercase(),
      password: string().required(),
    });
    try {
      await inputSchema.validate(req.body);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).send({
          message: `invalid input:${error.message}`,
          result: null,
        });
      }
    }
    const { account, email, password } = inputSchema.cast(req.body);

    // check member existence
    if (
      (await AuthService.getMemberByAccountOrEmail(account)) ||
      (await AuthService.getMemberByAccountOrEmail(email))
    ) {
      return res.status(400).send({
        message: 'this account or email cannot be used',
        result: null,
      });
    }

    // const loggedInMembers = (req.session as Session)[appId]?.members || [];
    const { member, authToken } = await AuthService.registerMember({
      account,
      email,
      password,
    });

    return res.status(201).send({
      message: 'successfully register a new member',
      result: { authToken },
    });
  };
  public static loginHandler: RequestHandler = async (req, res: ApiResponse) => {
    // validate input
    const inputSchema = object({
      account: string().required().lowercase(),
      password: string().required(),
    });
    try {
      await inputSchema.validate(req.body);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).send({
          message: `invalid input:${error.message}`,
          result: null,
        });
      }
    }

    const { account, password } = inputSchema.cast(req.body);

    try {
      const { authToken, member } = await AuthService.login({ account, password });
      res.status(200).send({
        message: 'login successfully',
        result: { authToken, member },
      });
    } catch (error) {
      console.log(error);
      if (error instanceof Error && 'code' in error) {
        res.status(error.code as number).send({
          message: error.message,
          result: null,
        });
      }

      res.status(500).send({
        message: (error as Error).message,
        result: null,
      });
    }
  };
  public static logoutHandler: RequestHandler = async (req, res: ApiResponse) => {};
}

export default AuthController;

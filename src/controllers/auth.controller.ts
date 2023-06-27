import { RequestHandler } from 'express';
import { ApiResponse, AuthRequest } from '../types/shared';
import { object, string } from 'yup';
import { AuthService } from '../services';
import { prismaClient } from '../helpers';

class AuthController {
  public static decodeTokenHandler: RequestHandler = async (req: AuthRequest, res: ApiResponse) => {
    return res.status(200).send({
      message: 'success',
      result: req.auth,
    });
  };

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

    try {
      const token = await AuthService.generateReservationToken(reservationLogId);

      res.status(200).send({
        message: 'successfully create token',
        result: {
          token,
        },
      });
    } catch (error) {}
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
        res.status(400).json({
          message: `invalid input:${error.message}`,
          result: null,
        });
      }
    }
    const { account, email, password } = inputSchema.cast(req.body);
    console.log(account, email, password);
    // check member existence
    if (
      (await AuthService.getMemberByAccountOrEmail(account)) ||
      (await AuthService.getMemberByAccountOrEmail(email))
    ) {
      res.status(400).send({
        message: 'this account or email cannot be used',
        result: null,
      });
    } else {
      // const loggedInMembers = (req.session as Session)[appId]?.members || [];
      const { member, authToken } = await AuthService.registerMember({
        account,
        email,
        password,
      });
      res.status(201).send({
        message: 'successfully register a new member',
        result: { authToken },
      });
    }
    res.status(400).send({
      message: 'Can not register',
      result: null,
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
        return res.status(400).json({
          message: `invalid input:${error.message}`,
          result: null,
        });
      }
      return res.status(500).json({
        message: (error as Error).message,
        result: null,
      });
    }

    const { account, password } = inputSchema.cast(req.body);

    try {
      const { authToken, member } = await AuthService.login({ account, password });
      return res.status(200).json({
        message: 'login successfully',
        result: { authToken, member },
      });
    } catch (error) {
      console.log(error);
      if (error instanceof Error && 'code' in error) {
        return res.status(error.code as number).json({
          message: error.message,
          result: null,
        });
      }

      return res.status(500).json({
        message: (error as Error).message,
        result: null,
      });
    }
  };
  public static logoutHandler: RequestHandler = async (req, res: ApiResponse) => {};
}

export default AuthController;

import { RequestHandler } from 'express';
import { ApiResponse } from '../types/shared';
import { object, string } from 'yup';
import { AuthService } from '../services';

class AuthController {
  public static generateTokenHandler: RequestHandler = async (req, res: ApiResponse) => {};
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
          result: {},
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
        result: {},
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
          result: {},
        });
      }
    }

    const { account, password } = inputSchema.cast(req.body);

    try {
      const { authToken, member } = await AuthService.login({ account, password });
      return res.status(200).send({
        message: 'login successfully',
        result: { authToken, member },
      });
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        return res.status(error.code as number).send({
          message: error.message,
          result: {},
        });
      }

      return res.status(500).send({
        message: (error as Error).message,
        result: {},
      });
    }
  };
  public static logoutHandler: RequestHandler = async (req, res: ApiResponse) => {};
}

export default AuthController;

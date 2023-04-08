import { RequestHandler } from 'express';
import { ApiResponse } from '../types/shared';

class AuthController {
  public static generateTokenHandler: RequestHandler = async (req, res: ApiResponse) => {};
  public static loginHandler: RequestHandler = async (req, res: ApiResponse) => {};
  public static logoutHandler: RequestHandler = async (req, res: ApiResponse) => {};
}

export default AuthController;

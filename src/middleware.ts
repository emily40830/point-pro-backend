import { NextFunction, Request } from 'express';
import { ApiResponse, AuthRequest } from './types/shared';
import { throwError } from './helpers/utils';
import jwt from 'jsonwebtoken';
import { string, object, number } from 'yup';

export const verifyMiddleware = async (req: AuthRequest, res: ApiResponse, next: NextFunction) => {
  if (!process.env.POINT_PRO_SECRET) {
    throw new Error('no jwt secret');
  }

  if (req.headers.authorization?.split(' ')[0] !== 'Bearer') {
    return throwError({
      code: 401,
      message: 'UnAuthorized',
      sendError: true,
    });
  }
  try {
    const token = req.headers.authorization.split(' ')[1];

    if (!token)
      return res.status(403).send({
        message: 'Forbidden',
        result: null,
      });
    const payload = jwt.verify(token, process.env.POINT_PRO_SECRET);
    const userSchema = object({
      sub: string().required(),
      memberId: string().required(),
      account: string().required(),
      name: string().optional(),
      email: string().required(),
      role: string().required(),
      iat: number().required(),
      exp: number().required(),
    });
    req.user = await userSchema.validate(payload);
    next();
  } catch (error) {
    res.status(400).send({
      message: error instanceof Error ? error.message : 'Something went wrog',
      result: null,
    });
  }
};

export const errorMiddleware = (error: Error, req: Request, res: ApiResponse, next: NextFunction) => {
  return res.status(500).send({ message: `${error.name} ${error.message}`, result: null });
};

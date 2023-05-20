import jwt from 'jsonwebtoken';
import { NextFunction, Request } from 'express';
import { ApiResponse, AuthRequest } from './types/shared';
import { object, string, number } from 'yup';
import session from 'express-session';
import { orderSchema } from './schemas';

const verifySchema = object({
  sub: string().required(),
  iat: number().required(),
  exp: number().required(),
  memberId: string().required(),
  account: string().required(),
  email: string().optional(),
  role: string().required(),
});

const secret = process.env.POINT_PRO_SECRET || 'point-proo';

const oneDay = 1000 * 60 * 60 * 24;

//session middleware
export const sessionMiddleware = session({
  secret: 'point-pro',
  saveUninitialized: true,
  cookie: { maxAge: oneDay },
  resave: false,
});

export const verifyMiddleware = (excludes?: string[]) => (req: AuthRequest, res: ApiResponse, next: NextFunction) => {
  console.log(req.path);
  console.log(excludes);

  if (excludes && excludes.includes(req.path)) {
    return next();
  }
  const token = req.headers.authorization?.split(' ')[1];
  //Authorization: 'Bearer TOKEN'
  if (!token) {
    res.status(401).send({
      message: 'invalid token',
      result: null,
    });
  } else {
    const decoded = jwt.verify(token, secret);
    try {
      verifySchema.validateSync(decoded);
      const user = verifySchema.cast(decoded);
      console.log('user', user);

      req.user = user;
      next();
    } catch (error) {
      res.status(403).send({
        message: error as string,
        result: null,
      });
    }
  }
};

export const errorMiddleware = (error: Error, req: Request, res: ApiResponse, next: NextFunction) => {
  return res.status(500).send({ message: `${error.name} ${error.message}`, result: null });
};

export const validateOrderData = (req: Request, res: ApiResponse, next: NextFunction) => {
  try {
    const orderData = req.body;

    orderSchema.validateSync(orderData);

    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid order data', result: error?.toString() });
  }
};

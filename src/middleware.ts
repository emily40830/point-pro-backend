import jwt from 'jsonwebtoken';
import { NextFunction, Request } from 'express';
import { ApiResponse, AuthRequest } from './types/shared';
import { object, string, number, date } from 'yup';
import session from 'express-session';

export const verifyAdminSchema = object({
  sub: string().required(),
  iat: number().required(),
  exp: number().required(),
  memberId: string().required(),
  account: string().required(),
  email: string().optional(),
  role: string().required(),
});

export const verifyReservationSchema = object({
  reservationLogId: string().required(),
  reservationType: string().optional(),
  startTime: date().required(),
  seatNo: string().required(),
  periodStartTime: date().optional(),
  periodEndTime: date().optional(),
});

const verifyUserSchema = verifyAdminSchema || verifyReservationSchema;

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
    let decoded: string | jwt.JwtPayload = '';

    // console.log('decode', decoded);
    const errors = [];
    try {
      decoded = jwt.verify(token, secret);
    } catch (error) {
      errors.push(error as string);
    }
    try {
      verifyUserSchema.validateSync(decoded);
      const user = verifyUserSchema.cast(decoded);
      // console.log('user', user);

      req.auth = user;
      next();
    } catch (error) {
      errors.push(error as string);
    }

    if (!errors) {
      next();
    }

    try {
      verifyReservationSchema.validateSync(decoded);
      const reservation = verifyReservationSchema.cast(decoded);
      console.log('reservation', reservation);

      req.auth = { ...reservation, role: 'USER' };
      next();
    } catch (error) {
      errors.push(error as string);
    }

    if (errors.length > 1) {
      res.status(403).send({
        message: errors.join('; '),
        result: null,
      });
    }
  }
};

export const errorMiddleware = (error: Error, req: Request, res: ApiResponse, next: NextFunction) => {
  return res.status(500).send({ message: `${error.name} ${error.message}`, result: null });
};

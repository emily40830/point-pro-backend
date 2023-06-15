import { Response, Request } from 'express';

type UserAuth = {
  sub: string;
  iat: number;
  exp: number;
  memberId: string;
  account: string;
  email?: string;
  role: string;
};

type ReservationAuth = {
  reservationLogId: string;
  reservationType?: string;
  startTime: Date;
  seatNo: string;
  periodStartTime?: Date;
  periodEndTime?: Date;
  role?: string;
};

type AuthRequest = Request & {
  auth: UserAuth | ReservationAuth;
};

declare global {
  namespace Express {
    interface Request {
      auth: UserAuth | ReservationAuth;
    }
  }
}

type ApiResponse<T = any> = Response<{
  message: string;
  result: T | null;
}>;

interface ResponseError extends Error {
  code?: number;
}

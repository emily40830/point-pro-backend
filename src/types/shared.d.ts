import { Response, Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        iat: number;
        exp: number;
        memberId: string;
        account: string;
        email?: string;
        role: string;
      };
    }
  }
}

type AuthRequest = Request & {
  auth?:
    | { role: string } & (
        | {
            sub: string;
            iat: number;
            exp: number;
            memberId: string;
            account: string;
            email?: string;
          }
        | {
            reservationLogId: string;
            reservationType?: string;
            startTime: Date;
            seatNo: string;
            periodStartTime?: Date;
            periodEndTime?: Date;
          }
      );
};

type ApiResponse = Response<{
  message: string;
  result: any;
}>;

interface ResponseError extends Error {
  code?: number;
}

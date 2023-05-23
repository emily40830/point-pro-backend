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
  user?: {
    sub: string;
    iat: number;
    exp: number;
    memberId: string;
    account: string;
    email?: string;
    role: string;
  };
};

type ApiResponse = Response<{
  message: string;
  result: any;
}>;

interface ResponseError extends Error {
  code?: number;
}

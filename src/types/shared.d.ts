import { Response } from 'express';

type ApiResponse = Response<{
  message: string;
  result: any;
}>;

interface ResponseError extends Error {
  code?: number;
}

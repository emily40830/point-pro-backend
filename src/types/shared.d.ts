import { Response } from 'express';

type ApiResponse = Response<{
  message: string;
  result: any;
}>;

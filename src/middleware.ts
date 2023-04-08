import { NextFunction, Request } from 'express';
import { ApiResponse } from './types/shared';

const errorMiddleware = (error: Error, req: Request, res: ApiResponse, next: NextFunction) => {
  return res.status(500).send({ message: `${error.name} ${error.message}`, result: null });
};

export default errorMiddleware;

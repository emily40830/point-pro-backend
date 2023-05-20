import { NextFunction, Request } from 'express';
import { ApiResponse } from './types/shared';
import { orderSchema } from './schemas';

const errorMiddleware = (error: Error, req: Request, res: ApiResponse, next: NextFunction) => {
  return res.status(500).send({ message: `${error.name} ${error.message}`, result: null });
};

export default errorMiddleware;

export const validateOrderData = (req: Request, res: ApiResponse, next: NextFunction) => {
  try {
    const orderData = req.body;

    orderSchema.validateSync(orderData);

    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid order data', result: error?.toString() });
  }
};
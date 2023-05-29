import { NextFunction } from 'express';
import { ApiResponse, AuthRequest } from '../types/shared';
import { orderSchema } from '../schemas';

export const ValidateOrderData = (req: AuthRequest, res: ApiResponse, next: NextFunction) => {
  try {
    const orderData = req.body;

    orderSchema.validateSync(orderData);

    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid order data', result: error?.toString() });
  }
};

export default ValidateOrderData;

import { NextFunction } from 'express';
import { ApiResponse, AuthRequest } from '../types/shared';
import {
  createOrderReqBodySchema,
  orderIdValidatedSchema,
  orderStatusValidatedSchema,
  reservationLogValidatedSchema,
  updateOrderReqBodySchema,
} from '../schemas';

export const createOrderHandlerValidation = (req: AuthRequest, res: ApiResponse, next: NextFunction) => {
  try {
    reservationLogValidatedSchema.validateSync(req.auth);
    createOrderReqBodySchema.validateSync(req.body);
    next();
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).send({
        message: error.message,
        result: {},
      });
    }
  }
};

export const getOrderHandlerValidation = (req: AuthRequest, res: ApiResponse, next: NextFunction) => {
  try {
    if (req.auth.role === 'MERCHANT') {
      orderStatusValidatedSchema.validateSync(req.query);
    }

    if (req.auth.role === 'USER') {
      reservationLogValidatedSchema.validateSync(req.auth);
    }
    next();
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).send({
        message: error.message,
        result: [],
      });
    }
  }
};

export const cancelOrderHandlerValidation = (req: AuthRequest, res: ApiResponse, next: NextFunction) => {
  try {
    orderIdValidatedSchema.validateSync(req.query);
    next();
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).send({
        message: error.message,
        result: {},
      });
    }
  }
};

export const updateOrderHandlerValidation = (req: AuthRequest, res: ApiResponse, next: NextFunction) => {
  try {
    updateOrderReqBodySchema.validateSync(req.body);
    next();
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).send({
        message: error.message,
        result: {},
      });
    }
  }
};

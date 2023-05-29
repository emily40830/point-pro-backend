import { RequestHandler } from 'express';
import { validate as uuidValidate } from 'uuid';
import { ApiResponse } from '../types/shared';
import { prismaClient } from '../helpers';
import { OrderLog } from '@prisma/client';

class OrderController {
  public static createOrderHandler: RequestHandler = async (req, res: ApiResponse, next) => {
    try {
      const { type, status, orderMeals, reservationLogId } = req.body;

      const orderLog = await prismaClient.orderLog.create({
        data: {
          status,
          type,
          reservationLogId,
          orderMeals: {
            createMany: {
              data: orderMeals,
            },
          },
        },
      });

      return res.status(201).send({
        message: 'success',
        result: orderLog,
      });
    } catch (error) {
      next(error);
    }
  };

  public static getOrdersHandler: RequestHandler<
    {},
    {},
    {},
    {
      reservationLogId: OrderLog['reservationLogId'];
    }
  > = async (req, res: ApiResponse, next) => {
    try {
      const { reservationLogId } = req.query;

      if (!reservationLogId) {
        return res.status(401).send({ message: 'Reservation ID is required.', result: [] });
      }

      if (!uuidValidate(reservationLogId)) {
        return res.status(401).send({ message: 'No such reservation ID found.', result: [] });
      }

      const orders = await prismaClient.orderLog.findMany({
        select: {
          status: true,
          type: true,
          created_at: true,
          updated_at: true,
          paymentLogs: true,
          orderMeals: {
            select: {
              id: true,
              price: true,
              amount: true,
              servedAmount: true,
              mealTitle: true,
              mealDetails: true,
            },
          },
        },
        where: {
          reservationLogId,
        },
      });

      return res.status(200).send({
        message: 'success',
        result: orders,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default OrderController;

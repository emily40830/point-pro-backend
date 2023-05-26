import { RequestHandler } from 'express';
import { ApiResponse } from '../types/shared';
import { prismaClient } from '../helpers';

class OrderController {
  public static createOrderHandler: RequestHandler = async (req, res: ApiResponse, next) => {
    try {
      const { type, status, orderMeals } = req.body;

      const orderLog = await prismaClient.orderLog.create({
        data: {
          status,
          type,
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

  public static getOrdersHandler: RequestHandler = async (req, res: ApiResponse, next) => {
    try {
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

import { RequestHandler } from 'express';
import { ApiResponse } from '../types/shared';
import { prismaClient } from '../helpers';
import { array, number, object, string } from 'yup';
import { Specialty } from '@prisma/client';

class OrderController {
  public static createOrderHandler: RequestHandler = async (req, res: ApiResponse, next) => {
    // Validation
    try {
      // [REFACTOR]
      const reqBodySchema = object({
        reservationLogId: string().optional(),
        orderMeals: array()
          .of(
            object({
              id: string().required(),
              amount: number().required(),
              price: number().required(),
              specialties: array().of(
                object({
                  id: string().required(),
                  title: string().required(),
                  type: string().required(),
                  specialtyItems: array().of(
                    object({
                      id: string().required(),
                      title: string().required(),
                      price: number().required(),
                    }),
                  ),
                }),
              ),
            }),
          )
          .required(),
      });

      reqBodySchema.validateSync(req.body);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).send({
          message: error.message,
          result: {},
        });
      }
    }

    // DB
    try {
      const { orderMeals = [], reservationLogId } = req.body;

      const orderLog = await prismaClient.orderLog.create({
        data: {
          reservationLogId,
          type: reservationLogId ? 'DineIn' : 'TakeOut',
          status: 'PENDING',
          orderMeals: {
            createMany: {
              // [TODO] type
              data: orderMeals.map((meal: any) => ({
                mealId: meal.id,
                amount: meal.amount,
                price: meal.price,
                mealDetails: JSON.stringify(meal.specialties), // [REFACTOR] column rename?
              })),
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
    const userRole = req.auth.role;
    if ('reservationLogId' in req.auth) {
      // do something
    }
    // Validation
    try {
      // [REFACTOR]
      const reqQuerySchema = object({
        reservationLogId: string().optional().uuid(),
      });

      reqQuerySchema.validateSync(req.query);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).send({
          message: error.message,
          result: [],
        });
      }
    }

    // DB
    try {
      // [TODO] reservationLogId type
      const { reservationLogId } = req.query as { reservationLogId: string };
      const orders = await prismaClient.orderLog.findMany({
        select: {
          id: true,
          status: true,
          type: true,
          createdAt: true,
          updatedAt: true,
          paymentLogs: true,
          orderMeals: {
            select: {
              meal: {
                select: {
                  id: true,
                  title: true,
                },
              },
              price: true,
              amount: true,
              servedAmount: true,
              mealDetails: true,
            },
          },
        },
        where: {
          // [TODO] takeout id filter
          reservationLogId: null,
        },
      });

      const result = orders.map(({ orderMeals, ...rest }) => ({
        ...rest,
        orderMeals: orderMeals.map(({ mealDetails, meal, price, amount, servedAmount }) => ({
          ...meal,
          amount,
          servedAmount,
          price,
          specialties: JSON.parse(mealDetails as string), // [TODO] mealDetails type
        })),
      }));

      return res.status(200).send({
        message: 'success',
        result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default OrderController;

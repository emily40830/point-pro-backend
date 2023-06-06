import { RequestHandler } from 'express';
import { ApiResponse } from '../types/shared';
import { prismaClient } from '../helpers';
import { array, number, object, string } from 'yup';
import { AuthRequest } from '../types/shared';

class OrderController {
  public static createOrderHandler: RequestHandler = async (req: AuthRequest, res: ApiResponse, next) => {
    // Validation
    const reqAuthSchema = object({
      reservationLogId: string().uuid().required(),
    });
    const reqBodySchema = object({
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
                items: array().of(
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

    try {
      reqAuthSchema.validateSync(req.auth);
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
      const { reservationLogId } = reqAuthSchema.cast(req.auth);
      const { orderMeals = [] } = reqBodySchema.cast(req.body);
      const orderLog = await prismaClient.orderLog.create({
        data: {
          reservationLogId,
          // [TODO] takeout
          type: reservationLogId ? 'DineIn' : 'TakeOut',
          status: 'PENDING',
          orderMeals: {
            createMany: {
              // [TODO] type
              data: orderMeals.map((meal) => ({
                mealId: meal.id,
                amount: meal.amount,
                price: meal.price,
                mealDetails: JSON.stringify(meal.specialties),
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
  public static getOrdersHandler: RequestHandler = async (req: AuthRequest, res: ApiResponse, next) => {
    if (req.auth.role === 'USER') {
      // Validation
      const reqAuthSchema = object({
        reservationLogId: string().uuid().required(),
      });

      try {
        reqAuthSchema.validateSync(req.auth);
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
        const { reservationLogId } = reqAuthSchema.cast(req.auth);

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
            reservationLogId,
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
    }

    if (req.auth.role === 'MERCHANT') {
      // [TODO]
    }
  };
}

export default OrderController;

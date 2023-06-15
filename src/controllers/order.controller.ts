import { RequestHandler } from 'express';
import { ApiResponse } from '../types/shared';
import { prismaClient } from '../helpers';
import { array, mixed, number, object, string } from 'yup';
import { AuthRequest } from '../types/shared';
import { OrderStatus, OrderType } from '@prisma/client';

class OrderController {
  public static createOrderHandler: RequestHandler = async (req: AuthRequest, res: ApiResponse, next) => {
    // Validation
    const reqAuthSchema = object({
      reservationLogId: string().uuid(),
    });
    const reqBodySchema = object({
      orderMeals: array()
        .of(
          object({
            id: string().required(),
            amount: number().required(),
            price: number().required(),
            title: string().required(),
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
                mealTitle: meal.title,
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
                id: true,
                price: true,
                amount: true,
                servedAmount: true,
                mealDetails: true,
                meal: {
                  select: {
                    id: true,
                    title: true,
                    price: true,
                    categories: {
                      select: {
                        category: {
                          select: {
                            id: true,
                            title: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          where: {
            reservationLogId,
          },
        });

        const result = orders.map(({ orderMeals, ...rest }) => ({
          ...rest,
          orderMeals: orderMeals.map(({ id, mealDetails, price, amount, servedAmount, meal }) => ({
            id,
            amount,
            servedAmount,
            price,
            mealPrice: meal.price,
            mealId: meal.id,
            title: meal.title,
            categories: meal.categories.map((category) => ({ ...category.category })),
            specialties: JSON.parse(mealDetails as string), // [TODO] mealDetails type,
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
      // Validation
      const reqQuerySchema = object({
        status: mixed().oneOf(Object.values(OrderStatus)).required(),
      });

      try {
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
        const { status } = reqQuerySchema.cast(req.query);

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
                id: true,
                price: true,
                amount: true,
                servedAmount: true,
                mealDetails: true,
                meal: {
                  select: {
                    id: true,
                    title: true,
                    price: true,
                    categories: {
                      select: {
                        category: {
                          select: {
                            id: true,
                            title: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            reservationsLogs: {
              select: {
                bookedSeat: {
                  select: {
                    id: true,
                    seatPeriod: {
                      select: {
                        seat: {
                          select: {
                            prefix: true,
                            no: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          where: {
            status,
          },
        });

        const result = orders.map(({ orderMeals, reservationsLogs, ...rest }) => {
          // [TODO]: sibling seats?
          const { no = 0, prefix = '' } = reservationsLogs?.bookedSeat?.seatPeriod?.seat ?? {};

          return {
            ...rest,
            orderMeals: orderMeals.map(({ id, mealDetails, price, amount, servedAmount, meal }) => ({
              id,
              amount,
              servedAmount,
              price,
              mealPrice: meal.price,
              mealId: meal.id,
              title: meal.title,
              categories: meal.categories.map((category) => ({ ...category.category })),
              specialties: JSON.parse(mealDetails as string), // [TODO] mealDetails type,
            })),
            seats: [`${prefix}-${no}`],
          };
        });

        return res.status(200).send({
          message: 'success',
          result,
        });
      } catch (error) {
        next(error);
      }
    }
  };
  public static deleteOrderHandler: RequestHandler = async (req: AuthRequest, res: ApiResponse, next) => {
    // Validation
    const reqQuerySchema = object({
      orderId: string().uuid().required(),
    });
    try {
      reqQuerySchema.validateSync(req.query);
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
      const { orderId } = reqQuerySchema.cast(req.query);

      await prismaClient.orderLog.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCEL,
        },
      });

      return res.status(200).send();
    } catch (error) {
      next(error);
    }
  };
  public static updateOrderHandler: RequestHandler = async (req: AuthRequest, res: ApiResponse, next) => {
    // Validation
    const reqBodySchema = object({
      id: string().uuid().required(),
      status: string().oneOf(Object.values(OrderStatus)).required(),
      type: string().oneOf(Object.values(OrderType)).required(),
      orderMeals: array()
        .of(
          object({
            id: string().required(),
            amount: number().required(),
            servedAmount: number().required(),
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
      const { id, status, orderMeals } = reqBodySchema.cast(req.body);

      // are meals all served
      let isAllServed = true;
      orderMeals.forEach((meal) => {
        if (meal.amount !== meal.servedAmount) {
          isAllServed = false;
        }
      });

      // is order payment set
      const isPaid = await prismaClient.paymentLog.findFirst({
        where: {
          orderId: id,
        },
      });

      // is order cancelled
      const isCancelled = status === OrderStatus.CANCEL;

      // new status
      let newStatus: OrderStatus;
      if (isCancelled) {
        newStatus = OrderStatus.CANCEL;
      } else if (isAllServed && isPaid) {
        newStatus = OrderStatus.SUCCESS;
      } else if (isAllServed && !isPaid) {
        newStatus = OrderStatus.UNPAID;
      } else {
        newStatus = OrderStatus.PENDING;
      }

      const result = await prismaClient.$transaction(async (prismaClient) => {
        const updatedOrderLog = await prismaClient.orderLog.update({
          where: { id },
          data: {
            status: newStatus,
          },
          include: {
            orderMeals: true,
          },
        });

        // [TODO] is looping the only way?
        for (const meal of orderMeals) {
          await prismaClient.orderMeal.update({
            where: { id: meal.id },
            data: {
              servedAmount: meal.servedAmount,
            },
          });
        }

        return updatedOrderLog;
      });

      return res.status(200).send({
        message: 'success',
        result,
      });
    } catch (error) {
      console.log({ error });

      next(error);
    }
  };
}

export default OrderController;

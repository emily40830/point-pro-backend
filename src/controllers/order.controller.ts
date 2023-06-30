import { RequestHandler } from 'express';
import { ApiResponse } from '../types/shared';
import { prismaClient } from '../helpers';
import { AuthRequest } from '../types/shared';
import { OrderStatus, OrderType } from '@prisma/client';
import {
  orderIdValidatedSchema,
  reservationLogValidatedSchema,
  createOrderReqBodySchema,
  orderStatusValidatedSchema,
  updateOrderReqBodySchema,
} from '../schemas';

class OrderController {
  public static createOrderHandler: RequestHandler = async (req: AuthRequest, res: ApiResponse, next) => {
    try {
      const { reservationLogId } = reservationLogValidatedSchema.cast(req.auth);
      const { orderMeals = [] } = createOrderReqBodySchema.cast(req.body);

      const order = await prismaClient.orderLog.create({
        data: {
          reservationLogId,
          type: reservationLogId ? OrderType.DineIn : OrderType.TakeOut,
          status: OrderStatus.PENDING,
          orderMeals: {
            createMany: {
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
      });

      const result = {
        ...order,
        orderMeals:
          order.orderMeals.map(({ id, mealDetails, price, amount, servedAmount, meal }) => ({
            id,
            amount,
            servedAmount,
            price,
            mealPrice: meal.price,
            mealId: meal.id,
            title: meal.title,
            categories: meal.categories.map((category) => ({ ...category.category })),
            specialties: JSON.parse(mealDetails as string), // [TODO] mealDetails type,
          })) ?? [],
      };

      return res.status(201).send({
        message: 'success',
        result,
      });
    } catch (error) {
      next(error);
    }
  };
  public static getOrdersHandler: RequestHandler = async (req: AuthRequest, res: ApiResponse, next) => {
    if (req.auth.role === 'USER') {
      try {
        const { reservationLogId } = reservationLogValidatedSchema.cast(req.auth);

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
      try {
        const { status } = orderStatusValidatedSchema.cast(req.query);

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
            reservationLogId: true,
            reservationsLogs: {
              select: {
                id: true,
                bookedSeats: {
                  include: {
                    seat: true,
                    period: true,
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
          const seats = reservationsLogs?.bookedSeats?.map(
            (reservationSeat) => reservationSeat.seat.prefix + '-' + reservationSeat.seat.no,
          );

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
            seats,
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
  public static cancelOrderHandler: RequestHandler = async (req: AuthRequest, res: ApiResponse, next) => {
    try {
      const { orderId } = orderIdValidatedSchema.cast(req.query);

      const orderLog = await prismaClient.orderLog.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCEL,
        },
      });

      return res.status(200).send({
        message: 'success',
        result: orderLog,
      });
    } catch (error) {
      next(error);
    }
  };
  public static updateOrderHandler: RequestHandler = async (req: AuthRequest, res: ApiResponse, next) => {
    try {
      const { id, status, orderMeals } = updateOrderReqBodySchema.cast(req.body);

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
      next(error);
    }
  };
}

export default OrderController;

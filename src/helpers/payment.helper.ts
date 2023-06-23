import { Meal, OrderLog, OrderMeal, OrderStatus, PaymentLog } from '@prisma/client';
import { prismaClient } from './prismaClient';
import { Product, RequestRequestBody } from 'line-pay-merchant';
import { ApiResponse } from '../types/shared';
import { randomUUID } from 'crypto';

export interface OrderMealWithMeal extends OrderMeal {
  meal: Meal;
}
export interface OrderLogWithMeal extends OrderLog {
  orderMeals: (OrderMealWithMeal & { meal: Meal })[];
  parentOrder: OrderLog | null;
  childOrders?: OrderLog[];
}

interface UpdatePaymentLogBody {
  payment: PaymentLog | PaymentLog[];
  gateway: string;
  status: string;
}

export class OrderProcessor {
  static async getOrder(orderIds: string[]): Promise<OrderLogWithMeal[] | null> {
    const orders = await prismaClient.orderLog.findMany({
      where: {
        id: {
          in: orderIds,
        },
      },
      include: {
        orderMeals: {
          include: {
            meal: true,
          },
        },
        parentOrder: true,
        childOrders: true,
      },
    });
    return orders;
  }

  static async parentOderHandler(orders: OrderLogWithMeal[]): Promise<OrderLogWithMeal | null> {
    if (!orders) {
      throw new Error('No orders found');
    }

    if (orders.length > 1) {
      const updateOrder = await Promise.all(
        orders.map((order) =>
          prismaClient.orderLog.update({
            where: { id: order.id },
            data: { parentOrderId: orders[0].id },
          }),
        ),
      );

      const parentOrder = (await OrderProcessor.getOrder([orders[0].id])) as OrderLogWithMeal[];

      return parentOrder[0];
    }

    const parentOrder = await prismaClient.orderLog.update({
      where: { id: orders[0].id },
      data: {
        parentOrderId: orders[0].id,
      },
      include: {
        orderMeals: {
          include: {
            meal: true,
          },
        },
        parentOrder: true,
      },
    });

    return parentOrder;
  }
}

export class PaymentProcessor {
  static async getPayment(orders: OrderLogWithMeal[]): Promise<PaymentLog[] | null> {
    const orderId = orders.map((order) => order.id);
    const paymentLog = await prismaClient.paymentLog.findMany({
      where: {
        orderId: {
          in: orderId,
        },
      },
      include: {
        order: {
          include: {
            orderMeals: {
              include: {
                meal: true,
              },
            },
            parentOrder: true,
          },
        },
      },
    });
    return paymentLog;
  }

  static async createPaymentLog(orders: OrderLogWithMeal[]): Promise<PaymentLog[]> {
    if (orders.length > 1) {
      const paymentLog = orders.map((order) => {
        return prismaClient.paymentLog.create({
          data: {
            paymentNo: randomUUID(),
            orderId: order.id,
            price: order.orderMeals.reduce((acc, cur) => acc + cur.price * cur.amount, 0),
            status: 'UNPAID',
            gateway: 'NULL',
          },
        });
      });
      return Promise.all(paymentLog);
    }
    const paymentLog = await prismaClient.paymentLog.create({
      data: {
        paymentNo: randomUUID(),
        orderId: orders[0].id,
        price: orders[0].orderMeals.reduce((acc, cur) => acc + cur.price * cur.amount, 0),
        status: 'UNPAID',
        gateway: 'NULL',
      },
    });
    return [paymentLog];
  }

  static async updatePaymentLog({ payment, gateway, status }: UpdatePaymentLogBody): Promise<PaymentLog[]> {
    const orderId = Array.isArray(payment) ? payment.map((p) => p.orderId) : payment.orderId;
    await prismaClient.paymentLog.updateMany({
      where: {
        orderId: {
          in: orderId,
        },
      },
      data: {
        status,
        gateway,
      },
    });

    const paymentLog = await prismaClient.paymentLog.findMany({
      where: {
        orderId: {
          in: orderId,
        },
      },
    });

    await prismaClient.orderLog.updateMany({
      where: {
        id: {
          in: orderId,
        },
      },
      data: {
        status:
          status === 'SUCCESS' ? OrderStatus.SUCCESS : status === 'CANCEL' ? OrderStatus.CANCEL : OrderStatus.UNPAID,
      },
    });

    return paymentLog;
  }

  static async checkPaymentStatus(orderId: string): Promise<boolean> {
    const order = await prismaClient.orderLog.findUnique({
      where: { id: orderId },
      include: { paymentLogs: true },
    });

    if (!order) {
      throw new Error(`Order with id ${orderId} not found`);
    }

    if (!order.paymentLogs) {
      throw new Error(`No payment log found for order with id ${orderId}`);
    }

    const state = order.paymentLogs.filter((paymentLog) => paymentLog.status === 'SUCCESS');

    return state.length > 0;
  }

  static calculateTotalAmount(orders: OrderLogWithMeal[]): number {
    return orders.reduce(
      (total, order) => total + order.orderMeals.reduce((sum: number, meal: OrderMeal) => sum + meal.price, 0),
      0,
    );
  }

  static createLinePayOrder = (
    orders: OrderLogWithMeal[],
    orderId: string,
    confirmUrl: string,
    cancelUrl: string,
  ): RequestRequestBody => {
    return {
      amount: orders.reduce((total, order) => total + order.orderMeals.reduce((sum, meal) => sum + meal.price, 0), 0),
      currency: 'TWD',
      orderId,
      packages: orders.flatMap((order) =>
        order.orderMeals.map((meal) => {
          const mealDetails = JSON.parse(meal.mealDetails as string);
          const mealDetailPrice = mealDetails.reduce((total: number, detail: { items: [] }) => {
            const detailPrice = detail.items.reduce((total: number, item: { price: number }) => total + item.price, 0);
            return total + detailPrice;
          }, 0);
          return {
            id: meal.mealId,
            amount: meal.price,
            products: [
              {
                name: meal.mealTitle,
                imageUrl: meal.meal.coverUrl,
                quantity: meal.amount,
                price: meal.meal.price + mealDetailPrice,
              },
            ] as Product[],
          };
        }),
      ),
      redirectUrls: {
        confirmUrl, // Client端的轉導網址 (付款完成後，會導回此網址)
        cancelUrl, // Client 端的轉導網址 (付款取消後，會導回此網址)
      },
    };
  };
  static async errorNotFindHandler(res: ApiResponse, message: string) {
    res.status(400).json({ message, result: {} });
  }
}

export default { OrderProcessor, PaymentProcessor };

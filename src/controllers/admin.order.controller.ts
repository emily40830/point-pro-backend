import { RequestHandler } from 'express';
import { ApiResponse } from '../types/shared';
import { prismaClient as prisma } from '../helpers';

class AdminOrderController {
  public static getOrderHandler: RequestHandler = async (req, res: ApiResponse) => {
    try {
      const { orderId } = req.params;

      const order = await prisma.orderLog.findUnique({
        where: { id: orderId },
        include: { orderMeals: true },
      });

      if (!order) {
        res.status(404).json({ message: `無此訂單 - ${orderId}`, result: {} });
        return;
      }

      res.json({ message: `成功取得訂單 - ${orderId}`, result: order });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', result: error?.toString() });
    }
  };
  public static getAllOrdersHandler: RequestHandler = async (req, res: ApiResponse) => {
    try {
      const orders = await prisma.orderLog.findMany({
        include: { orderMeals: true },
      });

      res.json({ message: `成功取得所有訂單`, result: orders });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', result: error?.toString() });
    }
  };
  public static createOrderHandler: RequestHandler = async (req, res: ApiResponse) => {
    try {
      const { orderId, status, type, orderMeals } = req.body;

      const orderLog = await prisma.orderLog.create({
        data: {
          status: status,
          type: type,
          orderMeals: {
            create: orderMeals,
          },
        },
      });

      res.status(201).json({ message: `成功建立訂單 - ${orderId}`, result: orderLog });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', result: error?.toString() });
    }
  };

  public static updateOrderHandler: RequestHandler = async (req, res: ApiResponse) => {
    try {
      const { orderId } = req.params;
      const { status, parentOrderId, type, orderMeals } = req.body;

      const updatedOrderLog = await prisma.orderLog.update({
        where: { id: orderId },
        data: {
          status,
          parentOrderId,
          type,
          orderMeals: {
            deleteMany: {},
            create: orderMeals,
          },
        },
      });

      res.json({ message: `成功更新訂單 - ${orderId}`, result: updatedOrderLog });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', result: error?.toString() });
    }
  };
  public static deleteOrderHandler: RequestHandler = async (req, res: ApiResponse) => {
    try {
      const { orderId } = req.params;

      await prisma.orderMeal.deleteMany({
        where: { orderId },
      });

      await prisma.orderLog.delete({
        where: { id: orderId },
      });

      res.json({ message: `成功刪除訂單 - ${orderId}`, result: {} });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', result: error?.toString() });
    }
  };
}

export default AdminOrderController;

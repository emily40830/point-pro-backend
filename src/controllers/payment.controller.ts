import { createLinePayClient } from 'line-pay-merchant';
import { Request, RequestHandler } from 'express';
import { ApiResponse } from '../types/shared';
import { prismaClient as prisma } from '../helpers';
import { RequestRequestBody } from '../types/linepay';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      LINE_PAY_CHANNEL_ID: string;
      LINE_PAY_CHANNEL_SECRET: string;
      LINE_PAY_ENV: 'development' | 'production';
      NODE_ENV: 'dev' | 'production';
    }
  }
}

const channelId = process.env.LINE_PAY_CHANNEL_ID;
const channelSecretKey = process.env.LINE_PAY_CHANNEL_SECRET;

const linePayConfig = {
  channelId,
  channelSecretKey,
  isSandbox: process.env.NODE_ENV !== 'production' ? true : false,
  env: process.env.LINE_PAY_ENV || 'sandbox',
};

const linePayClient = createLinePayClient(linePayConfig);

export class LinePayController {
  public static requestHandler: RequestHandler = async (req: Request, res: ApiResponse) => {
    try {
      const { amount, currency, orderId, packages, redirectUrls, options }: RequestRequestBody = req.body;

      const paymentRequest = {
        amount,
        currency: 'TWD',
        orderId,
        packages: packages,
        redirectUrls: {
          confirmUrl: redirectUrls.confirmUrl,
          cancelUrl: redirectUrls.cancelUrl,
        },
      };

      const response = await linePayClient.request.send({
        body: {
          ...paymentRequest,
        },
      });

      await prisma.paymentLog.create({
        data: {
          orderId,
          payment_no: response.body.transactionId,
          price: amount,
          gateway: 'LINE_PAY',
          status: 'UNPAID',
        },
      });

      res.status(200).json({ message: 'success', result: response });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', result: null });
    }
  };

  public static confirmHandler: RequestHandler = async (req: Request, res: ApiResponse) => {
    try {
      const { transactionId }: { transactionId: string } = req.body;

      const paymentLog = await prisma.paymentLog.findUnique({
        where: {
          payment_no: transactionId,
        },
      });

      if (!paymentLog) {
        return res.status(400).json({ message: 'Invalid transaction ID', result: null });
      }

      const response = linePayClient.confirm.send({
        transactionId,
        body: {
          currency: 'TWD',
          amount: paymentLog.price,
        },
      });

      await prisma.paymentLog.update({
        where: {
          payment_no: transactionId,
        },
        data: {
          status: 'SUCCESS',
        },
      });

      await prisma.orderLog.update({
        where: {
          id: paymentLog.orderId,
        },
        data: {
          status: 'SUCCESS',
        },
      });

      res.status(200).json({ message: 'success', result: response });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', result: null });
    }
  };

  public static refundHandler: RequestHandler = async (req: Request, res: ApiResponse) => {
    try {
      const { transactionId } = req.body;

      const paymentLog = await prisma.paymentLog.findUnique({
        where: {
          payment_no: transactionId,
        },
      });

      if (!paymentLog) {
        return res.status(400).json({ message: 'Invalid transaction ID', result: null });
      }

      const response = await linePayClient.refund.send({ transactionId, body: { refundAmount: paymentLog.price } });

      await prisma.orderLog.update({
        where: {
          id: paymentLog.orderId,
        },
        data: {
          status: 'REFUND',
        },
      });

      res.status(200).json({ message: 'success', result: response });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', result: null });
    }
  };
}

import { Product, createLinePayClient, RequestRequestBody } from 'line-pay-merchant';
import { CreditOneTimePayment, Merchant } from 'node-ecpay-aio';
import { ApiResponse } from '../types/shared';
import { prismaClient as prisma } from '../helpers';

import { Request, RequestHandler, Response } from 'express';
import { LinePayClient } from 'line-pay-merchant/dist/type';
import { BasePaymentParams, CreditOneTimePaymentParams } from 'node-ecpay-aio/dist/types';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      LINE_PAY_CHANNEL_ID: string;
      LINE_PAY_CHANNEL_SECRET: string;
      LINE_PAY_ENV: 'development' | 'production';
      NODE_ENV: 'dev' | 'production';
      HOST_URL: string;
      EC_PAY_MERCHANT_ID: string;
      EC_PAY_HASH_KEY: string;
      EC_PAY_HASH_IV: string;
    }
  }
}

export class LinePayController {
  private static linePayClient: LinePayClient;
  constructor() {
    LinePayController.linePayClient = createLinePayClient({
      channelId: process.env.LINE_PAY_CHANNEL_ID,
      channelSecretKey: process.env.LINE_PAY_CHANNEL_SECRET,
      env: process.env.LINE_PAY_ENV,
    });
  }
  public static requestHandler: RequestHandler = async (req: Request, res: ApiResponse) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: '缺少 orderId', result: {} });
      }

      const order = await prisma.orderLog.findUnique({
        where: { id },
        include: {
          orderMeals: true,
        },
      });

      if (!order) {
        return res.status(404).json({ message: '找不到訂單', result: {} });
      }

      const paymentLog = await prisma.paymentLog.findFirst({
        where: { orderId: id },
      });

      if (!paymentLog) {
        return res.status(400).json({ message: '找不到付款紀錄', result: {} });
      }

      if (paymentLog && paymentLog.status === 'SUCCESS') {
        return res.status(400).json({ message: '訂單已經完成付款', result: {} });
      }

      const linePayOrder: RequestRequestBody = {
        amount: order.orderMeals.reduce((sum, meal) => sum + meal.price, 0),
        currency: 'TWD',
        orderId: id,
        packages: order.orderMeals.map((meal) => {
          const mealDetails = meal.mealDetails as { title: string; coverUrl: string; price: number };
          return {
            id: meal.mealId,
            amount: meal.amount,
            products: [
              {
                name: mealDetails.title,
                imageUrl: mealDetails.coverUrl,
                quantity: meal.amount,
                price: mealDetails.price,
              },
            ] as Product[],
          };
        }),
        redirectUrls: {
          confirmUrl: `${process.env.HOST_URL}/api/payment/line-pay/confirm`, // 跳轉這裡還需要確認
          cancelUrl: `${process.env.HOST_URL}/api/payment/line-pay/cancel`, // 跳轉這裡還需要確認
        },
      };

      const response = await this.linePayClient.request.send({
        body: {
          ...linePayOrder,
        },
      });

      await prisma.paymentLog.update({
        where: {
          orderId: id,
        },
        data: {
          orderId: id,
          payment_no: response.body.transactionId,
          price: linePayOrder.amount,
          gateway: 'LINE_PAY',
          status: 'PENDING',
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

      const response = await this.linePayClient.confirm.send({
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

      const response = await this.linePayClient.refund.send({
        transactionId,
        body: { refundAmount: paymentLog.price },
      });

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

export class EcPayController {
  private static merchant: Merchant;
  constructor() {
    EcPayController.merchant = new Merchant('Test', {
      MerchantID: process.env.ECPAY_MERCHANT_ID || '',
      HashKey: process.env.ECPAY_HASH_KEY || '',
      HashIV: process.env.ECPAY_HASH_IV || '',
      ReturnURL: `${process.env.FRONTEND_HOST}/payments/ec-pay/return`,
    });
  }

  public static requestHandler: RequestHandler = async (req: Request, res: ApiResponse) => {
    try {
      const { orderId } = req.params;

      const now = new Date();
      const formattedDate = `${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now
        .getDate()
        .toString()
        .padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      const order = await prisma.orderLog.findUnique({
        where: {
          id: orderId,
        },
      });
      if (!order) {
        return res.status(400).json({ message: 'Invalid order ID', result: null });
      }

      let tradeDesc = '';
      let itemDesc = '';

      // itemDesc = order.orderMeals.map((item) => `${item.name} x ${item.quantity}`).join('#');
      // orderDesc = `${order.name} x ${order.quantity}`;

      const baseParams: BasePaymentParams = {
        MerchantTradeNo: Date.now().toString(),
        MerchantTradeDate: formattedDate,
        TotalAmount: 1000,
        TradeDesc: tradeDesc,
        ItemName: itemDesc,
        // ReturnURL: undefined,      // 若在 merchant 設定過, 此處不需再設定, 除非你針對此單要用個別的 hook
        // ClientBackURL: undefined,  // 若在 merchant 設定過, 此處不需再設定, 除非你針對此單要用個別的轉導網址
        // OrderResultURL: undefined, // 若在 merchant 設定過, 此處不需再設定, 除非你針對此單要用個別的轉導網址
      };
      const params: CreditOneTimePaymentParams = {
        // 皆為選填
        Language: '', // 語系: undefined(繁中) | 'ENG' | 'KOR' | 'JPN' | 'CHI'
        Redeem: 'Y', // 紅利折抵: undefined(不用) | 'Y' (使用)
      };

      const payment = EcPayController.merchant.createPayment(CreditOneTimePayment, baseParams, params);
      const htmlRedirectPostForm = await payment.checkout(/* 可選填發票 */);
      res.status(200).json({ message: 'success', result: htmlRedirectPostForm });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', result: null });
    }
  };

  public static returnHandler: RequestHandler = async (req: Request, res: Response) => {
    try {
      res.send('1|OK');
    } catch (error) {
      res.send;
    }
  };
}

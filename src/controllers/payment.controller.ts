import { createLinePayClient } from '../types/line-pay';
import { ALLPayment, Merchant, isValidReceivedCheckMacValue } from 'node-ecpay-aio';
import { ApiResponse } from '../types/shared';
import { prismaClient } from '../helpers';

import { Request, RequestHandler, Response } from 'express';

import { BasePaymentParams, ALLPaymentParams } from 'node-ecpay-aio/dist/types';

import { LinePayClient } from '../types/line-pay/type';
import { Product, RequestRequestBody } from '../types/line-pay';

declare global {
  export interface ProcessEnv {
    LINE_PAY_CHANNEL_ID: string;
    LINE_PAY_CHANNEL_SECRET: string;
    LINE_PAY_ENV: 'development' | 'production';
    NODE_ENV: 'dev' | 'production';
    FRONTEND_HOST: string;
    BACKEND_HOST: string;
    EC_PAY_MERCHANT_ID: string;
    EC_PAY_HASH_KEY: string;
    EC_PAY_HASH_IV: string;
  }
}

export class LinePayController {
  private static linePayClient: LinePayClient;
  constructor() {
    LinePayController.linePayClient = createLinePayClient({
      channelId: process.env.LINE_PAY_CHANNEL_ID as string,
      channelSecretKey: process.env.LINE_PAY_CHANNEL_SECRET as string,
      env: process.env.LINE_PAY_ENV as 'development' | 'production',
    });
  }
  public static requestHandler: RequestHandler = async (req: Request, res: ApiResponse) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: '缺少 orderId', result: {} });
      }

      const order = await prismaClient.orderLog.findUnique({
        where: {
          id: id,
        },
        include: {
          orderMeals: true,
          parentOrder: true,
        },
      });

      if (!order) {
        return res.status(404).json({ message: '找不到訂單', result: {} });
      }

      if (order.parentOrder?.status === 'SUCCESS') {
        return res.status(400).json({ message: '訂單已付款', result: {} });
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
          confirmUrl: `${process.env.FRONTEND_HOST}/payment/confirm`, // Client 端的轉導網址 (付款完成後，會導回此網址)
          cancelUrl: `${process.env.FRONTEND_HOST}/payment/cancel`, // Client 端的轉導網址 (付款取消後，會導回此網址)
        },
      };

      const response = await this.linePayClient.request.send({
        body: {
          ...linePayOrder,
        },
      });

      res.status(200).json({ message: 'success', result: response });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', result: null });
    }
  };

  public static confirmHandler: RequestHandler = async (req: Request, res: ApiResponse) => {
    try {
      const { transactionId, orderId }: { transactionId?: string; orderId?: string } = req.params;

      const order = await prismaClient.orderLog.findUnique({
        where: {
          id: orderId,
        },
        include: {
          orderMeals: true,
        },
      });

      const amount = order?.orderMeals.reduce((sum, meal) => sum + meal.price, 0);

      const response = await this.linePayClient.confirm.send({
        transactionId,
        body: {
          currency: 'TWD',
          amount: amount as number,
        },
      });

      if (response.body.returnCode !== '0000') {
        return res.status(400).json({ message: 'Invalid transaction ID', result: null });
      }

      const payment = await prismaClient.paymentLog.findFirst({
        where: {
          paymentNo: transactionId,
        },
      });

      if (!payment) {
        await prismaClient.paymentLog.create({
          data: {
            paymentNo: transactionId,
            orderId,
            price: amount as number,
            status: 'SUCCESS',
            gateway: 'LINE_PAY',
          },
        });
      } else {
        await prismaClient.paymentLog.update({
          where: {
            paymentNo: transactionId,
          },
          data: {
            status: 'SUCCESS',
          },
        });
      }

      await prismaClient.orderLog.update({
        where: {
          id: orderId,
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
      const { orderId } = req.params;

      const paymentLog = await prismaClient.paymentLog.findFirst({
        where: {
          orderId,
        },
      });

      if (!paymentLog) {
        return res.status(400).json({ message: 'Invalid transaction ID', result: null });
      }

      const response = await this.linePayClient.refund.send({
        transactionId: paymentLog.paymentNo,
        body: { refundAmount: paymentLog.price },
      });

      if (response.body.returnCode !== '0000') {
        return res.status(400).json({ message: 'Invalid transaction ID', result: null });
      }

      await prismaClient.orderLog.update({
        where: {
          id: orderId,
        },
        data: {
          status: 'CANCEL',
        },
      });

      res.status(200).json({ message: 'success', result: response });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', result: null });
    }
  };
}

interface CheckMacValueData {
  CheckMacValue: string;
}

export class EcPayController {
  private static merchant: Merchant;
  constructor() {
    EcPayController.merchant = new Merchant('Test', {
      MerchantID: process.env.EC_PAY_MERCHANT_ID as string,
      HashKey: process.env.EC_PAY_HASH_KEY as string,
      HashIV: process.env.EC_PAY_HASH_IV as string,
      ReturnURL: `${process.env.BACKEND_HOST}/payments/ec-pay/return`, // Server 端的轉導網址 (付款完成後，POST接受綠界的付款結果訊息，並回應接收訊息)
    });
  }

  public static requestHandler: RequestHandler = async (req: Request, res: ApiResponse) => {
    try {
      const { orderId } = req.params;

      const now = new Date();
      const formattedDate = now.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      const order = await prismaClient.orderLog.findUnique({
        where: {
          id: orderId,
        },
        include: {
          orderMeals: true,
          parentOrder: true,
        },
      });
      if (!order) {
        return res.status(404).json({ message: '找不到訂單', result: {} });
      }

      if (order.parentOrder?.status === 'SUCCESS') {
        return res.status(400).json({ message: '訂單已付款', result: {} });
      }

      const { TradeDesc, ItemName, TotalAmount } = order?.orderMeals.reduce(
        (acc, meal) => {
          const mealDetails = meal.mealDetails as {
            title: string;
            coverUrl: string;
            price: number;
            description: string;
          };
          return {
            TradeDesc: acc.TradeDesc ? `${acc.TradeDesc},${mealDetails.description}` : mealDetails.description,
            ItemName: acc.ItemName ? `${acc.ItemName},${mealDetails.title}` : mealDetails.title,
            TotalAmount: acc.TotalAmount + meal.price,
          };
        },
        { TradeDesc: '', ItemName: '', TotalAmount: 0 },
      ) || { TradeDesc: '', ItemName: '', TotalAmount: 0 };

      const baseParams: BasePaymentParams = {
        MerchantTradeNo: Date.now().toString(),
        MerchantTradeDate: formattedDate,
        TotalAmount,
        TradeDesc,
        ItemName,
        ClientBackURL: `${process.env.FRONTEND_HOST}/return?orderId=${orderId}`, // Client 端的轉導網址 (付款完成後，會導回此網址)
      };
      const params = {
        // 皆為選填
        CustomField1: `OrderID=${orderId}`, // 自訂名稱 1
        PeriodReturnURL: undefined, // 定期定額的回傳網址
        ClientRedirectURL: undefined, // Client 端的轉導網址
        PaymentInfoURL: undefined, // Server 端的回傳網址
        Language: '', // 語系: undefined(繁中) | 'ENG' | 'KOR' | 'JPN' | 'CHI'
        Redeem: 'Y', // 紅利折抵: undefined(不用) | 'Y' (使用)
      };

      const payment = EcPayController.merchant.createPayment(
        ALLPayment,
        baseParams,
        params as unknown as ALLPaymentParams,
      );
      const htmlRedirectPostForm = await payment.checkout(/* 可選填發票 */);
      res.render('checkout', { title: 'ec-pay checkout', html: htmlRedirectPostForm });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', result: null });
    }
  };

  static handleCheckMacValue = (data: CheckMacValueData, HashKey: string, HashIV: string) => {
    return isValidReceivedCheckMacValue(data, HashKey, HashIV);
  };

  public static returnHandler: RequestHandler = async (req: Request, res: Response) => {
    try {
      const data = { ...req.body };
      const { CustomField1 } = data;

      const orderId = CustomField1.split('=')[1];

      const isValidReceivedCheckMacValue = EcPayController.handleCheckMacValue(
        data,
        process.env.EC_PAY_HASH_KEY as string,
        process.env.EC_PAY_HASH_IV as string,
      );

      if (!isValidReceivedCheckMacValue) {
        return res.send('0|ErrorMessage');
      }

      await prismaClient.orderLog.update({
        where: {
          id: orderId,
        },
        data: {
          status: 'SUCCESS',
        },
      });

      const paymentLog = await prismaClient.paymentLog.findFirst({
        where: {
          orderId,
        },
      });

      if (!paymentLog) {
        await prismaClient.paymentLog.create({
          data: {
            orderId,
            paymentNo: data.TradeNo,
            gateway: 'EC_PAY',
            price: data.TradeAmt,
            status: 'SUCCESS',
          },
        });
      } else {
        await prismaClient.paymentLog.update({
          where: {
            paymentNo: paymentLog.paymentNo,
          },
          data: {
            status: 'SUCCESS',
          },
        });
      }

      res.send('1|OK');
    } catch (error) {
      res.send;
    }
  };
}

import { createLinePayClient } from 'line-pay-merchant';
import { ALLPayment, Merchant, isValidReceivedCheckMacValue } from 'node-ecpay-aio';
import { ApiResponse } from '../types/shared';
import { prismaClient } from '../helpers';

import { Request, RequestHandler, Response } from 'express';

import { BasePaymentParams, ALLPaymentParams } from 'node-ecpay-aio/dist/types';

import { LinePayClient } from 'line-pay-merchant/dist/type';
import { Product, RequestRequestBody } from 'line-pay-merchant';

declare global {
  export interface ProcessEnv {
    LINE_PAY_CHANNEL_ID: string;
    LINE_PAY_CHANNEL_SECRET: string;
    LINE_PAY_ENV: 'development' | 'production';
    NODE_ENV: 'dev' | 'production';
    BACKEND_URL: string;
    EC_PAY_MERCHANT_ID: string;
    EC_PAY_HASH_KEY: string;
    EC_PAY_HASH_IV: string;
  }
}

interface CheckMacValueData {
  CheckMacValue: string;
}

export class PaymentController {
  public static linePayClient: LinePayClient;
  public static merchant: Merchant;

  // LinePay Handlers
  public static linePayRequestHandler: RequestHandler = async (req: Request, res: ApiResponse) => {
    try {
      const { orderId, confirmUrl, cancelUrl } = req.body;

      if (!orderId) {
        return res.status(400).json({ message: '缺少 orderId', result: {} });
      }

      const order = await prismaClient.orderLog.findUnique({
        where: {
          id: orderId,
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

      if (!order) {
        return res.status(404).json({ message: '找不到訂單', result: {} });
      }

      if (order.parentOrder?.status === 'SUCCESS') {
        return res.status(400).json({ message: '訂單已付款', result: {} });
      }

      const linePayOrder: RequestRequestBody = {
        amount: order.orderMeals.reduce((sum, meal) => sum + meal.price, 0),
        currency: 'TWD',
        orderId,
        packages: order.orderMeals.map((meal) => {
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
        redirectUrls: {
          confirmUrl, // Client 端的轉導網址 (付款完成後，會導回此網址)
          cancelUrl, // Client 端的轉導網址 (付款取消後，會導回此網址)
        },
      };
      console.log('order:', order);
      console.log('linePayFormat:', linePayOrder);

      const response = await PaymentController.linePayClient.request.send({
        body: linePayOrder,
      });

      console.log('request return response:', response);

      res.status(200).json({ message: 'line-pay checkout', result: response });
    } catch (error) {
      console.log('catch err:', error);
      res.status(500).json({ message: 'Internal server error', result: error });
    }
  };

  public static linePayConfirmHandler: RequestHandler = async (req: Request, res: ApiResponse) => {
    try {
      const { transactionId, orderId } = req.params;

      console.log('transactionId:', transactionId);
      console.log('orderId:', orderId);

      const order = await prismaClient.orderLog.findUnique({
        where: {
          id: orderId,
        },
        include: {
          orderMeals: true,
        },
      });

      const amount = order?.orderMeals.reduce((sum, meal) => sum + meal.price, 0);

      const response = await PaymentController.linePayClient.confirm.send({
        transactionId,
        body: {
          currency: 'TWD',
          amount: amount as number,
        },
      });

      console.log('confirm response:', response);

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
            gateway: 'LINE_PAY',
          },
        });
      }

      res.status(200).json({ message: 'success', result: response });
    } catch (error) {
      console.log('catch err:', error);
      res.status(500).json({ message: 'Internal server error', result: error });
    }
  };

  public static linePayRefundHandler: RequestHandler = async (req: Request, res: ApiResponse) => {
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

      const response = await PaymentController.linePayClient.refund.send({
        transactionId: paymentLog.paymentNo,
        body: { refundAmount: paymentLog.price },
      });

      if (response.body.returnCode !== '0000') {
        return res.status(400).json({ message: 'Invalid transaction ID', result: null });
      }

      res.status(200).json({ message: 'success', result: response });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', result: null });
    }
  };

  // EcPay Handlers
  public static ecPayRequestHandler: RequestHandler = async (req: Request, res: ApiResponse) => {
    try {
      const { orderId, confirmUrl } = req.body;

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

      console.log('order', order);

      const mealTitles = order.orderMeals
        .map((meal) => {
          const details = JSON.parse(meal.mealDetails as string);
          const title = details.reduce((str: string, detail: { items: []; title: string }) => {
            const detailTitle = detail.items.reduce(
              (str: string, item: { title: string }) => str + ', ' + item.title,
              '',
            );
            return str + detail.title + detailTitle;
          }, `${meal.mealTitle} - [`);
          return title + ']';
        })
        .join('#')
        .toString();

      console.log('mealTitles', mealTitles);

      const TradeDesc = mealTitles || '';
      const ItemName = order?.orderMeals.map((meal) => meal.mealTitle).join('#') || '';
      const TotalAmount = order?.orderMeals.reduce((acc, meal) => acc + meal.price, 0) || 0;

      const baseParams: BasePaymentParams = {
        MerchantTradeNo: Date.now().toString(),
        MerchantTradeDate: formattedDate,
        TotalAmount,
        TradeDesc,
        ItemName,
        ClientBackURL: confirmUrl, // Client 端的轉導網址 (付款完成後，會導回此網址)
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

      console.log('baseParams', baseParams);

      const payment = PaymentController.merchant.createPayment(
        ALLPayment,
        baseParams,
        params as unknown as ALLPaymentParams,
      );
      const htmlRedirectPostForm = await payment.checkout(/* 可選填發票 */);
      res.send({ message: 'ec-pay checkout', result: htmlRedirectPostForm });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', result: null });
    }
  };

  public static ecPayReturnHandler: RequestHandler = async (req: Request, res: Response) => {
    try {
      const data = { ...req.body };
      const { CustomField1 } = data;

      const orderId = CustomField1.split('=')[1];

      const isValidReceivedCheckMacValue = PaymentController.handleCheckMacValue(
        data,
        process.env.EC_PAY_HASH_KEY as string,
        process.env.EC_PAY_HASH_IV as string,
      );

      if (!isValidReceivedCheckMacValue) {
        return res.send('0|ErrorMessage');
      }

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
            gateway: 'EC_PAY',
          },
        });
      }

      res.send('1|OK');
    } catch (error) {
      res.send;
    }
  };

  static handleCheckMacValue = (data: CheckMacValueData, HashKey: string, HashIV: string) => {
    return isValidReceivedCheckMacValue(data, HashKey, HashIV);
  };

  public static cashPaymentHandler: RequestHandler = async (req: Request, res: ApiResponse) => {
    try {
      const { orderId } = req.body;

      console.log('orderId', orderId);

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

      const paymentLog = await prismaClient.paymentLog.findFirst({
        where: {
          orderId,
        },
      });
      if (!paymentLog) {
        await prismaClient.paymentLog.create({
          data: {
            orderId,
            paymentNo: Date.now().toString(),
            gateway: 'CASH',
            price: order.orderMeals.reduce((acc, meal) => acc + meal.price, 0),
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

      res.status(200).json({ message: 'Success', result: { paymentLog, order } });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', result: null });
    }
  };
}

PaymentController.linePayClient = createLinePayClient({
  channelId: process.env.LINE_PAY_CHANNEL_ID as string,
  channelSecretKey: process.env.LINE_PAY_CHANNEL_SECRET as string,
  env: process.env.LINE_PAY_ENV as 'development' | 'production',
});

PaymentController.merchant = new Merchant('Test', {
  MerchantID: process.env.EC_PAY_MERCHANT_ID as string,
  HashKey: process.env.EC_PAY_HASH_KEY as string,
  HashIV: process.env.EC_PAY_HASH_IV as string,
  ReturnURL: `${process.env.BACKEND_URL}/payment/ec-pay/confirm`, // Server 端的轉導網址 (付款完成後，POST接受綠界的付款結果訊息，並回應接收訊息)
});

export default PaymentController;

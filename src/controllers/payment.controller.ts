import { Request, RequestHandler, Response } from 'express';
import { mixed, object, string } from 'yup';
import { createLinePayClient } from 'line-pay-merchant';
import { ALLPayment, Merchant, isValidReceivedCheckMacValue } from 'node-ecpay-aio';

import { BasePaymentParams, ALLPaymentParams } from 'node-ecpay-aio/dist/types';
import { LinePayClient } from 'line-pay-merchant/dist/type';

import { prismaClient, OrderProcessor, PaymentProcessor } from '../helpers';
import { ApiResponse } from '../types/shared';

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

const linePayRequestSchema = object().shape({
  orderId: mixed().required('缺少 orderId'),
  confirmUrl: string().required('缺少 confirmUrl'),
  cancelUrl: string().required('缺少 cancelUrl'),
});

const ecPayRequestSchema = object().shape({
  orderId: mixed().required('缺少 orderId'),
  confirmUrl: string().required('缺少 confirmUrl'),
});

const cashPaymentSchema = object().shape({
  orderId: mixed().required('缺少 orderId'),
});

export class PaymentController {
  static errorNotFindHandler = PaymentProcessor.errorNotFindHandler;
  public static linePayClient: LinePayClient;
  public static merchant: Merchant;

  // LinePay Handlers
  public static linePayRequestHandler: RequestHandler = async (req: Request, res: ApiResponse) => {
    try {
      linePayRequestSchema.validateSync(req.body);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).send({
          message: error.message,
          result: {},
        });
      }
    }

    try {
      const { orderId, confirmUrl, cancelUrl } = req.body;

      let linePayOrder;

      const orders = await OrderProcessor.getOrder(orderId);
      if (!orders || !orders[0].parentOrderId) return this.errorNotFindHandler(res, '訂單不存在');
      const parentOrder = await OrderProcessor.parentOderHandler(orders);
      if (!parentOrder) return this.errorNotFindHandler(res, '訂單不存在');
      if (await PaymentProcessor.checkPaymentStatus(parentOrder.id)) return this.errorNotFindHandler(res, '訂單已付款');
      linePayOrder = PaymentProcessor.createLinePayOrder(orders, parentOrder.id, confirmUrl, cancelUrl);

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
      const { transactionId, orderId } = req.query as { transactionId: string; orderId: string };

      if (!transactionId || !orderId) {
        return this.errorNotFindHandler(res, '缺少 transactionId 或 orderId');
      }

      const parentOrder = await OrderProcessor.getOrder([orderId]);

      if (!parentOrder) return this.errorNotFindHandler(res, '訂單不存在');

      const payments = await PaymentProcessor.getPayment(parentOrder);
      const amount = payments?.reduce((total, payment) => payment.price, 0);

      if (!payments || !amount) {
        return this.errorNotFindHandler(res, '找不到付款紀錄');
      }

      const response = await PaymentController.linePayClient.confirm.send({
        transactionId,
        body: {
          currency: 'TWD',
          amount: amount,
        },
      });

      console.log('confirm response:', response);

      if (response.body.returnCode !== '0000') {
        return this.errorNotFindHandler(res, 'Invalid transaction ID');
      }

      const paymentLogs = PaymentProcessor.updatePaymentLog({
        payment: payments,
        status: 'SUCCESS',
        gateway: 'LINE_PAY',
      });

      res.status(200).json({
        message: 'success',
        result: {
          response,
          paymentLogs,
        },
      });
    } catch (error) {
      console.log('catch err:', error);
      res.status(500).json({ message: 'Internal server error', result: error });
    }
  };

  public static linePayRefundHandler: RequestHandler = async (req: Request, res: ApiResponse) => {
    try {
      const { orderId } = req.query as { orderId: string };

      if (!orderId) return this.errorNotFindHandler(res, '缺少 orderId');

      const order = await OrderProcessor.getOrder([orderId]);
      if (!order) return this.errorNotFindHandler(res, '訂單不存在');
      await OrderProcessor.parentOderHandler(order);
      const paymentLog = await prismaClient.paymentLog.findFirst({
        where: {
          orderId: order[0].id,
        },
      });

      if (!paymentLog) return this.errorNotFindHandler(res, '找不到付款紀錄');

      const response = PaymentController.linePayClient.refund.send({
        transactionId: paymentLog.paymentNo,
        body: { refundAmount: paymentLog.price },
      });

      res.status(200).json({ message: 'success', result: response });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', result: null });
    }
  };

  // EcPay Handlers
  public static ecPayRequestHandler: RequestHandler = async (req: Request, res: ApiResponse) => {
    try {
      ecPayRequestSchema.validateSync(req.body);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).send({
          message: error.message,
          result: {},
        });
      }
    }
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

      const orders = await OrderProcessor.getOrder(orderId);
      if (!orders) return this.errorNotFindHandler(res, '訂單不存在');
      const parentOrder = await OrderProcessor.parentOderHandler(orders);

      if (orders && parentOrder && parentOrder.status === 'SUCCESS') {
        return this.errorNotFindHandler(res, '訂單已付款');
      }

      const mealTitles =
        orders &&
        orders
          .map((order) =>
            order.orderMeals.map((meal) => {
              const details = JSON.parse(meal.mealDetails as string);
              const title = details.reduce((str: string, detail: { items: []; title: string }) => {
                const detailTitle = detail.items.reduce(
                  (str: string, item: { title: string }) => str + ', ' + item.title,
                  '',
                );
                return str + detail.title + detailTitle;
              }, `${meal.mealTitle} - [`);
              return title + ']';
            }),
          )
          .join('#')
          .toString();

      console.log('mealTitles', mealTitles);

      const TradeDesc = mealTitles || '';
      const ItemName = orders.map((order) => order.orderMeals.map((meal) => meal.mealTitle)).join('#') || '';
      const TotalAmount =
        orders.reduce((total, order) => total + order.orderMeals.reduce((acc, meal) => acc + meal.price, 0), 0) || 0;

      const baseParams: BasePaymentParams = {
        MerchantTradeNo: Date.now().toString(),
        MerchantTradeDate: formattedDate,
        TotalAmount,
        TradeDesc,
        ItemName,
        ClientBackURL: `${confirmUrl}?transactionId=${Date.now().toString()}&orderId=${orderId}`, // Client 端的轉導網址 (付款完成後，會導回此網址)
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

      console.log('ecPayReturnHandler data', data);

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
      cashPaymentSchema.validateSync(req.body);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).send({
          message: error.message,
          result: {},
        });
      }
    }
    try {
      const { orderId } = req.body;

      const orders = await OrderProcessor.getOrder(orderId);
      if (!orders) return this.errorNotFindHandler(res, '訂單不存在');
      const parentOrder = await OrderProcessor.parentOderHandler(orders);
      if (!parentOrder) return this.errorNotFindHandler(res, '訂單不存在');
      if (await PaymentProcessor.checkPaymentStatus(parentOrder.id)) return this.errorNotFindHandler(res, '訂單已付款');
      console.log('orders', orders);
      console.log('parentOrder', parentOrder);
      const payments = await PaymentProcessor.createPaymentLog(orders);

      await PaymentProcessor.updatePaymentLog({
        payment: payments,
        status: 'SUCCESS',
        gateway: 'CASH',
      });
      const paymentLogs = await PaymentProcessor.getPayment(orders);
      res.status(200).json({ message: 'Success', result: { paymentLogs } });
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

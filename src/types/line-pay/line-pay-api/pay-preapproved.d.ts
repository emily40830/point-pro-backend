import { LinePayApiClients } from '../payment-api/type';
import { GeneralRequestConfig, GeneralResponseBody } from './type';
export declare type PayPreapprovedRequestBody = {
  /**
   * Product name
   */
  productName: string;
  /**
   * Product amount
   */
  amount: number;
  /**
   * Payment currency ([ISO 4217](https://en.wikipedia.org/wiki/ISO_4217))\
   * Supported currencies are as follows.
   * - USD
   * - JPY
   * - TWD
   * - THB
   */
  currency: string;
  /**
   * An unique order ID
   */
  orderId: string;
  /**
   * Purchasement
   * - True : Authorized and purchased
   * - False : Authorized but need to purchase with Capture API
   */
  capture?: boolean;
};
export declare type PayPreapprovedRequestConfig = GeneralRequestConfig & {
  /**
   * A key used for automatic payment
   */
  regKey: string;
  /**
   * Request body of payPreapproved API
   */
  body: PayPreapprovedRequestBody;
};
export declare type Info = {
  /**
   * An unique order ID sent upon requesting for payment.
   */
  orderId: string;
  /**
   * A transaction ID returned as the payment reservation result (19 digits).
   */
  transactionId: string;
  /**
   * Transaction date ([ISO 8601](https://en.wikipedia.org/wiki/ISO_8601))
   */
  transactionDate: string;
  /**
   * Expiration date ([ISO 8601](https://en.wikipedia.org/wiki/ISO_8601))
   */
  authorizationExpireDate?: string;
};
export declare type PayPreapprovedResponseBody = GeneralResponseBody & {
  /**
   * PayPreapproved information
   */
  info: Info;
};
export declare const defaultTimeout = 40000;
export declare const payPreapprovedWithClient: LinePayApiClients['payPreapproved'];

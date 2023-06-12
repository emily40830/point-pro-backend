import { LinePayApiClients } from '../payment-api/type';
import { GeneralRequestConfig, GeneralResponseBody } from './type';
/** Request */
export declare type RefundRequestBody = {
  /**
   * Refund amount
   * - Full refund if not returned
   */
  refundAmount: number;
};
export declare type RefundRequestConfig = GeneralRequestConfig & {
  /**
   * ID of the transaction
   */
  transactionId: string;
  /**
   * Request body of refund API
   */
  body: RefundRequestBody;
};
/** Response */
export declare type Info = {
  /**
   * Refund transaction ID (Newly issued, 19 digits)
   */
  refundTransactionId: string;
  /**
   * Refund transaction date (ISO 8601)
   */
  refundTransactionDate: string;
};
export declare type RefundResponseBody = GeneralResponseBody & {
  /**
   * Refund information
   */
  info: Info;
};
export declare const defaultTimeout = 20000;
export declare const refundWithClient: LinePayApiClients['refund'];

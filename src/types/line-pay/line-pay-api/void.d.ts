import { LinePayApiClients } from '../payment-api/type';
import { EmptyObject, GeneralRequestConfig, GeneralResponseBody } from './type';
export declare type VoidRequestBody = EmptyObject;
export declare type VoidRequestConfig = GeneralRequestConfig & {
  /**
   * ID of the transaction
   */
  transactionId: string;
  /**
   * Request body of void API
   */
  body?: VoidRequestBody;
};
export declare type VoidResponseBody = GeneralResponseBody;
export declare const defaultTimeout = 20000;
export declare const voidWithClient: LinePayApiClients['void'];

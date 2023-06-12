import { LinePayApiClients } from '../payment-api/type';
import { EmptyObject, GeneralRequestConfig, GeneralResponseBody } from './type';
export declare type ExpireRegKeyRequestBody = EmptyObject;
export declare type ExpireRegKeyRequestConfig = GeneralRequestConfig & {
  /**
   * A key used for automatic payment
   */
  regKey: string;
  /**
   * Request body of expireRegKey API
   */
  body?: ExpireRegKeyRequestBody;
};
export declare type ExpireRegKeyResponseBody = GeneralResponseBody;
export declare const defaultTimeout = 20000;
export declare const expireRegKeyWithClient: LinePayApiClients['expireRegKey'];

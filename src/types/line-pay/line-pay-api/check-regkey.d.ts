import { LinePayApiClients } from '../payment-api/type';
import { GeneralRequestConfig, GeneralResponseBody } from './type';
export declare type CheckRegKeyRequestParams = {
  /**
   * Whether credit cards issued with RegKey have authorized minimum amount
   * - True : Through LINE Pay verification and authentication of minimum amount of credit card, check the status of RegKey. It requires review from the LINE Pay manager.
   * - False : Check the RegKey status with LINE Pay verification.
   */
  creditCardAuth?: boolean;
};
export declare type CheckRegKeyRequestConfig = GeneralRequestConfig & {
  /**
   * A key used for automatic payment
   */
  regKey: string;
  /**
   * Request parameters of check regKey API
   */
  params?: CheckRegKeyRequestParams;
};
export declare type CheckRegKeyResponseBody = GeneralResponseBody;
export declare const defaultTimeout = 20000;
export declare const checkRegKeyWithClient: LinePayApiClients['checkRegKey'];

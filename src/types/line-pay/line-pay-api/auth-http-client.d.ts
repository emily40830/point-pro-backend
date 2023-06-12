import { AxiosInstance } from 'axios';
import { LineMerchantConfig, QueryParams } from './type';
export declare type AuthHttpClient = AxiosInstance;
/**
 * convert query object to query string
 *
 * @param params query string object
 * @returns query string
 */
export declare function paramsSerializer(params: QueryParams): string;
export declare function createAuthHttpClient(merchantConfig: LineMerchantConfig): AuthHttpClient;

import { HttpClient } from '../line-pay-api/type';
import { ApiHandler, PaymentApi, LinePayApiClients, RequestConfig, ResponseBody } from './type';
/**
 * Create a new Payment API instance
 *
 * @template T
 * @param type LINE Pay API type
 * @param createSender create a request sender function
 * @param httpClient the HTTP client
 * @param handlers handlers to add to the API client
 * @returns a new Payment API instance
 */
export declare function createPaymentApi<T extends keyof LinePayApiClients>(
  type: T,
  createSender: (httpClient: HttpClient) => (req: RequestConfig<T>) => Promise<ResponseBody<T>>,
  httpClient: HttpClient,
  handlers?: ApiHandler<T>[],
): PaymentApi<T>;

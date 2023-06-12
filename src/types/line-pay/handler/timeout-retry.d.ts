import { ApiHandler, LinePayApiClients } from '../payment-api/type';
/**
 * Create a handler that retries the request if it fails with a timeout error.
 *
 * Example:
 * ```ts
 * const maxRetry = 10 // will send maximum 11 times (10 retry + 1 initial request)
 * const retryTimeout = 5000 // retry after 5 seconds (after request failed)
 * handlers.createTimeoutRetryHandler(maxRetry, retryTimeout)
 * ```
 *
 * @param maxRetry maximum number of retries
 * @param retryTimeout milliseconds to wait before retrying
 * @returns a handler that retries the request if it fails with a timeout error
 */
export declare const createTimeoutRetryHandler: <T extends keyof LinePayApiClients>(maxRetry?: number, retryTimeout?: number) => ApiHandler<T>;

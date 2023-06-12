import { ConfirmResponseBody } from '../line-pay-api/confirm';
import { PaymentDetailsResponseBody } from '../line-pay-api/payment-details';
import { RefundResponseBody } from '../line-pay-api/refund';
import { ApiHandler, RequestConfig, ResponseBody } from '../payment-api/type';
/**
 * Convert confirm response or refund response body to payment details response body
 */
export declare type PaymentDetailsConverter<T extends 'confirm' | 'refund'> = (req: RequestConfig<T>, paymentDetailsResponseBody: PaymentDetailsResponseBody) => ResponseBody<T>;
/**
 * Response converter for confirm API. Convert the response body from payment details API to confirm API.
 *
 * @param req original request
 * @param paymentDetails response body from payment details API
 * @returns confirm API response body
 */
export declare function paymentDetailsToConfirm<T extends 'confirm'>(req: RequestConfig<T>, paymentDetails: PaymentDetailsResponseBody): ConfirmResponseBody;
/**
 * Response converter for refund API. Convert the response body from payment details API to refund API.
 *
 * @param req original request
 * @param paymentDetails response body from payment details API
 * @returns refund API response body
 */
export declare function paymentDetailsToRefund<T extends 'refund'>(req: RequestConfig<T>, paymentDetails: PaymentDetailsResponseBody): RefundResponseBody;
/**
 * Create a handler for confirm and refund API. The handler will handle the 1172 and 1198 error and timeout error by calling the payment details API and verify the transaction result.
 *
 * @param converter convert payment details to response body (confirm/refund)
 * @param predicate predicate to determine whether the error should be handled
 * @returns API handler
 */
export declare const createPaymentDetailsRecoveryHandler: <T extends "confirm" | "refund">(converter: PaymentDetailsConverter<T>, predicate?: (error: unknown) => boolean) => ApiHandler<T>;

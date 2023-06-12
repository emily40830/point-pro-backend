import { LinePayApiClients } from '../payment-api/type';
import { GeneralRequestConfig, GeneralResponseBody } from './type';
import { Currency, Address } from './type';
/** Request */
export declare type ConfirmRequestBody = {
  /**
   * Payment amount
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
  currency: Currency;
};
export declare type ConfirmRequestConfig = GeneralRequestConfig & {
  /**
   * ID of the transaction
   */
  transactionId: string;
  /**
   * Request body of confirm API
   */
  body: ConfirmRequestBody;
};
/** Response */
export declare type PayInfo = {
  /**
   * A payment method used for payment
   * - Credit card: CREDIT_CARD
   * - Balance: BALANCE
   * - Discount: DISCOUNT
   */
  method: string;
  /**
   * Payment amount
   */
  amount: number;
  /**
   * Credit card nickname for automatic payment
   * - Credit card name managed at LINE Pay. It is the name registered when registered to LINE Pay.
   * - If LINE Pay user does not set a nickname, an empty string will be sent.
   * - The nickname can be changed upon user's request and the change history will not be shared with the merchant.
   */
  creditCardNickname?: string;
  /**
   * Credit card brand used for automatic payment
   * - VISA
   * - MASTER
   * - AMEX
   * - DINERS
   * - JCB
   */
  creditCardBrand?: string;
  /**
   * Masked credit card number (Send only for Taiwan merchants. Able to use the feature when requesting to the merchant center manager. Not sending in payment details API).
   * - Format: **** **** **** 1234
   */
  maskedCreditCardNumber?: string;
};
export declare type Package = {
  /**
   * An unique ID of package list
   */
  id: string;
  /**
   * Name of the sales products
   */
  name?: string;
  /**
   * Total amount of products per package\
   * `=sum(products[].quantity * products[].price)`
   */
  amount: number;
  /**
   * User fee: Sent as a respond if a list of fee is found within the payment amount.
   */
  userFeeAmount?: number;
};
export declare type Shipping = {
  /**
   * An ID of shipping method selected by user
   */
  methodId: string;
  /**
   * Shipping fee
   */
  feeAmount: number;
  /**
   * Shipping address
   */
  address: Address;
};
export declare type Info = {
  /**
   * An unique order ID of the merchant sent upon requesting the payment.
   */
  orderId: string;
  /**
   * Transaction ID
   */
  transactionId: string;
  /**
   * Authentication expiration date and time (ISO 8601)
   * - Send if the payment proceeded only up to authentication (capture=false)
   */
  authorizationExpireDate?: string;
  /**
   * A key for automatic payment (15 digits)
   */
  regKey?: string;
  /**
   * Payment information
   */
  payInfo: PayInfo[];
  /**
   * Package information
   */
  packages: Package[];
  /**
   * Shipping information
   */
  shipping?: Shipping;
};
export declare type ConfirmResponseBody = GeneralResponseBody & {
  /**
   * Payment information
   */
  info: Info;
};
export declare const defaultTimeout = 40000;
export declare const confirmWithClient: LinePayApiClients['confirm'];

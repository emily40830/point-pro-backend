import { GeneralResponseBody } from '../type';
export declare class LinePayApiError extends Error {
    statusCode: number;
    data: GeneralResponseBody;
    constructor(message: string, statusCode: number, data: GeneralResponseBody);
}
export declare function isLinePayApiError(error: unknown): error is LinePayApiError;

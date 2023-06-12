export declare class HttpError extends Error {
    statusCode: number;
    data: unknown;
    constructor(message: string, statusCode: number, data: unknown);
}
export declare function isHttpError(error: unknown): error is HttpError;

export declare class TimeoutError extends Error {
    constructor(message: string);
}
export declare function isTimeoutError(error: unknown): error is TimeoutError;

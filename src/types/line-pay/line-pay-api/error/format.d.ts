export declare class FormatError extends Error {
    constructor(message: string);
}
export declare function isFormatError(error: unknown): error is FormatError;

export declare class AppError extends Error {
    readonly statusCode: number;
    readonly code: string;
    constructor(message: string, statusCode: number, code: string);
}
export declare const ErrorCodes: {
    INVALID_FILE_TYPE: string;
    FILE_TOO_LARGE: string;
    UPLOAD_FAILED: string;
    JOB_NOT_FOUND: string;
    INTERNAL_ERROR: string;
    BAD_REQUEST: string;
};
//# sourceMappingURL=errors.d.ts.map
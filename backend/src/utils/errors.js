"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCodes = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    code;
    constructor(message, statusCode, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
exports.AppError = AppError;
exports.ErrorCodes = {
    INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    UPLOAD_FAILED: 'UPLOAD_FAILED',
    JOB_NOT_FOUND: 'JOB_NOT_FOUND',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    BAD_REQUEST: 'BAD_REQUEST',
};
//# sourceMappingURL=errors.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMulterError = exports.uploadMiddleware = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const fs_1 = __importDefault(require("fs"));
const errors_1 = require("../../utils/errors");
// Ensure uploads directory exists
const uploadDir = 'uploads';
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir);
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const date = new Date().toISOString().split('T')[0];
        const pathWithDate = path_1.default.join(uploadDir, date);
        if (!fs_1.default.existsSync(pathWithDate)) {
            fs_1.default.mkdirSync(pathWithDate, { recursive: true });
        }
        cb(null, pathWithDate);
    },
    filename: (req, file, cb) => {
        const jobId = (0, uuid_1.v4)();
        req.jobId = jobId;
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        cb(null, `${jobId}${ext}`);
    },
});
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.webp', '.heic'];
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
        cb(null, true);
    }
    else {
        cb(new errors_1.AppError('Only image files are accepted (jpg, jpeg, png, webp, heic)', 400, errors_1.ErrorCodes.INVALID_FILE_TYPE), false);
    }
};
const maxFileSize = (parseInt(process.env.MAX_FILE_SIZE_MB || '10')) * 1024 * 1024;
exports.uploadMiddleware = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: maxFileSize,
    },
}).single('image');
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer_1.default.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new errors_1.AppError(`File too large. Max size is ${process.env.MAX_FILE_SIZE_MB || '10'}MB`, 413, errors_1.ErrorCodes.FILE_TOO_LARGE));
        }
        return next(new errors_1.AppError(err.message, 400, errors_1.ErrorCodes.UPLOAD_FAILED));
    }
    next(err);
};
exports.handleMulterError = handleMulterError;
//# sourceMappingURL=validateUpload.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = __importDefault(require("./utils/logger"));
const errors_1 = require("./utils/errors");
const upload_routes_1 = __importDefault(require("./api/routes/upload.routes"));
const results_routes_1 = __importDefault(require("./api/routes/results.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Request logger middleware
app.use((req, res, next) => {
    logger_1.default.info({
        method: req.method,
        url: req.url,
        ip: req.ip,
    });
    next();
});
// Routes
app.use('/api/uploads', upload_routes_1.default);
app.use('/api/results', results_routes_1.default);
// 404 handler
app.use((req, res, next) => {
    res.status(404).json({
        error: true,
        code: 'NOT_FOUND',
        message: 'Resource not found',
    });
});
// Global error handler
app.use((err, req, res, next) => {
    const statusCode = err instanceof errors_1.AppError ? err.statusCode : 500;
    const code = err instanceof errors_1.AppError ? err.code : 'INTERNAL_ERROR';
    const message = err.message || 'Internal server error';
    if (statusCode === 500) {
        logger_1.default.error({
            message: err.message,
            stack: err.stack,
            url: req.url,
            method: req.method,
        });
    }
    res.status(statusCode).json({
        error: true,
        code,
        message,
        jobId: req.jobId || null,
    });
});
exports.default = app;
//# sourceMappingURL=app.js.map
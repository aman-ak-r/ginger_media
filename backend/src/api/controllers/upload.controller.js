"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = void 0;
const express_1 = require("express");
const client_1 = __importDefault(require("../../db/client"));
const queue_1 = require("../../worker/queue");
const logger_1 = __importDefault(require("../../utils/logger"));
const errors_1 = require("../../utils/errors");
const uploadImage = async (req, res, next) => {
    try {
        if (!req.file) {
            throw new errors_1.AppError('No file attached', 400, errors_1.ErrorCodes.BAD_REQUEST);
        }
        const jobId = req.jobId;
        const file = req.file;
        // Save metadata to DB with status = pending
        const job = await client_1.default.imageJob.create({
            data: {
                id: jobId,
                originalFilename: file.originalname,
                storedPath: file.path,
                fileSizeBytes: file.size,
                mimeType: file.mimetype,
                status: 'pending',
            },
        });
        // Push job to queue
        await queue_1.imageQueue.add('process-image', {
            jobId,
            filePath: file.path,
        });
        logger_1.default.info('Image uploaded and job queued', { jobId, filename: file.originalname });
        return res.status(201).json({
            jobId: job.id,
            status: job.status,
            message: 'Image uploaded successfully. Processing started.',
            uploadedAt: job.uploadedAt,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.uploadImage = uploadImage;
//# sourceMappingURL=upload.controller.js.map
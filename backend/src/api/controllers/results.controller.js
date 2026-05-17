"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUploads = exports.getResults = exports.getStatus = void 0;
const express_1 = require("express");
const client_1 = __importDefault(require("../../db/client"));
const errors_1 = require("../../utils/errors");
const getStatus = async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const job = await client_1.default.imageJob.findUnique({
            where: { id: jobId },
        });
        if (!job) {
            throw new errors_1.AppError('Job not found', 404, errors_1.ErrorCodes.JOB_NOT_FOUND);
        }
        return res.status(200).json({
            jobId: job.id,
            status: job.status,
            uploadedAt: job.uploadedAt,
            startedAt: job.startedAt,
            completedAt: job.completedAt,
            failedAt: job.failedAt,
            failureReason: job.failureReason,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getStatus = getStatus;
const getResults = async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const job = await client_1.default.imageJob.findUnique({
            where: { id: jobId },
            include: { analysisResult: true },
        });
        if (!job) {
            throw new errors_1.AppError('Job not found', 404, errors_1.ErrorCodes.JOB_NOT_FOUND);
        }
        if (job.status === 'pending' || job.status === 'processing') {
            return res.status(202).json({
                jobId: job.id,
                status: job.status,
                message: 'Processing in progress',
            });
        }
        if (job.status === 'failed') {
            return res.status(200).json({
                jobId: job.id,
                status: job.status,
                failureReason: job.failureReason,
            });
        }
        if (!job.analysisResult) {
            throw new errors_1.AppError('Analysis result not found', 404, 'RESULT_NOT_FOUND');
        }
        const result = job.analysisResult;
        return res.status(200).json({
            jobId: job.id,
            status: job.status,
            overallStatus: result.overallStatus,
            issueCount: result.issueCount,
            processingDurationMs: result.processingDurationMs,
            checks: result.checksJson,
            metadata: {
                originalFilename: job.originalFilename,
                fileSizeBytes: job.fileSizeBytes,
                mimeType: job.mimeType,
                ...result.metadataJson,
            },
            summary: `${result.issueCount} issue(s) detected`,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getResults = getResults;
const listUploads = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status;
        const skip = (page - 1) * limit;
        const where = status ? { status } : {};
        const [data, total] = await Promise.all([
            client_1.default.imageJob.findMany({
                where,
                skip,
                take: limit,
                orderBy: { uploadedAt: 'desc' },
            }),
            client_1.default.imageJob.count({ where }),
        ]);
        return res.status(200).json({
            data,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.listUploads = listUploads;
//# sourceMappingURL=results.controller.js.map
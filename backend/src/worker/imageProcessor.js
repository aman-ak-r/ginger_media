"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageWorker = void 0;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const client_1 = __importDefault(require("../db/client"));
const logger_1 = __importDefault(require("../utils/logger"));
const index_1 = require("../checks/index");
const redisConnection = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});
exports.imageWorker = new bullmq_1.Worker('image-processing', async (job) => {
    const { jobId, filePath } = job.data;
    const startTime = Date.now();
    logger_1.default.info('Processing job started', { jobId });
    try {
        // Update status to processing
        await client_1.default.imageJob.update({
            where: { id: jobId },
            data: {
                status: 'processing',
                startedAt: new Date(),
            },
        });
        // Run analysis
        const analysis = await (0, index_1.runAllChecks)(jobId, filePath);
        const duration = Date.now() - startTime;
        // Save results and update job status
        await client_1.default.$transaction([
            client_1.default.analysisResult.create({
                data: {
                    jobId,
                    overallStatus: analysis.overallStatus,
                    issueCount: analysis.issueCount,
                    checksJson: analysis.checks,
                    metadataJson: analysis.metadata,
                    processingDurationMs: duration,
                },
            }),
            client_1.default.imageJob.update({
                where: { id: jobId },
                data: {
                    status: 'completed',
                    completedAt: new Date(),
                    phash: analysis.phash,
                },
            }),
        ]);
        logger_1.default.info('Job processed successfully', { jobId, overallStatus: analysis.overallStatus });
    }
    catch (error) {
        logger_1.default.error('Job processing failed', { jobId, error: error.message });
        const jobRecord = await client_1.default.imageJob.findUnique({ where: { id: jobId } });
        const currentRetry = jobRecord?.retryCount || 0;
        if (currentRetry < 2) { // 3 attempts total (0, 1, 2)
            await client_1.default.imageJob.update({
                where: { id: jobId },
                data: {
                    retryCount: currentRetry + 1,
                    // Keep as pending or update with error? 
                    // BullMQ will handle the actual retry, so we just log the attempt.
                }
            });
            throw error; // Rethrow for BullMQ retry
        }
        else {
            await client_1.default.imageJob.update({
                where: { id: jobId },
                data: {
                    status: 'failed',
                    failedAt: new Date(),
                    failureReason: error.message,
                },
            });
        }
    }
}, {
    connection: redisConnection,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '2'),
});
exports.imageWorker.on('completed', (job) => {
    logger_1.default.info(`Job ${job.id} completed`);
});
exports.imageWorker.on('failed', (job, err) => {
    logger_1.default.error(`Job ${job?.id} failed after retries`, { error: err.message });
});
//# sourceMappingURL=imageProcessor.js.map
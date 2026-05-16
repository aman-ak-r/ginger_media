import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import prisma from '../db/client.js';
import logger from '../utils/logger.js';
import { runAllChecks } from '../checks/index.js';

const redisConnection = new (Redis as any)(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const imageWorker = new Worker(
  'image-processing',
  async (job: Job) => {
    const { jobId, filePath } = job.data;
    const startTime = Date.now();

    logger.info('Processing job started', { jobId });

    try {
      // Update status to processing
      await prisma.imageJob.update({
        where: { id: jobId },
        data: {
          status: 'processing',
          startedAt: new Date(),
        },
      });

      // Run analysis
      const analysis = await runAllChecks(jobId, filePath);
      const duration = Date.now() - startTime;

      // Save results and update job status
      await prisma.$transaction([
        prisma.analysisResult.create({
          data: {
            jobId,
            overallStatus: analysis.overallStatus,
            issueCount: analysis.issueCount,
            checksJson: analysis.checks as any,
            metadataJson: analysis.metadata as any,
            processingDurationMs: duration,
          },
        }),
        prisma.imageJob.update({
          where: { id: jobId },
          data: {
            status: 'completed',
            completedAt: new Date(),
            phash: (analysis as any).phash,
          },
        }),
      ]);

      logger.info('Job processed successfully', { jobId, overallStatus: analysis.overallStatus });
    } catch (error: any) {
      logger.error('Job processing failed', { jobId, error: error.message });

      const jobRecord = await prisma.imageJob.findUnique({ where: { id: jobId } });
      const currentRetry = jobRecord?.retryCount || 0;

      if (currentRetry < 2) { // 3 attempts total (0, 1, 2)
        await prisma.imageJob.update({
          where: { id: jobId },
          data: {
            retryCount: currentRetry + 1,
            // Keep as pending or update with error? 
            // BullMQ will handle the actual retry, so we just log the attempt.
          }
        });
        throw error; // Rethrow for BullMQ retry
      } else {
        await prisma.imageJob.update({
          where: { id: jobId },
          data: {
            status: 'failed',
            failedAt: new Date(),
            failureReason: error.message,
          },
        });
      }
    }
  },
  {
    connection: redisConnection,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '2'),
  }
);

imageWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed`);
});

imageWorker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed after retries`, { error: err.message });
});

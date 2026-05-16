import { Request, Response, NextFunction } from 'express';
import prisma from '../../db/client.js';
import { AppError, ErrorCodes } from '../../utils/errors.js';

export const getStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;
    const job = await prisma.imageJob.findUnique({
      where: { id: jobId as string },
    });

    if (!job) {
      throw new AppError('Job not found', 404, ErrorCodes.JOB_NOT_FOUND);
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
  } catch (error) {
    next(error);
  }
};

export const getResults = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;
    const job = await prisma.imageJob.findUnique({
      where: { id: jobId as string },
      include: { analysisResult: true },
    }) as any;

    if (!job) {
      throw new AppError('Job not found', 404, ErrorCodes.JOB_NOT_FOUND);
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
      throw new AppError('Analysis result not found', 404, 'RESULT_NOT_FOUND');
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
        ...result.metadataJson as any,
      },
      summary: `${result.issueCount} issue(s) detected`,
    });
  } catch (error) {
    next(error);
  }
};

export const listUploads = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as any;

    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [data, total] = await Promise.all([
      prisma.imageJob.findMany({
        where,
        skip,
        take: limit,
        orderBy: { uploadedAt: 'desc' },
      }),
      prisma.imageJob.count({ where }),
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
  } catch (error) {
    next(error);
  }
};

import { Request, Response, NextFunction } from 'express';
import prisma from '../../db/client.js';
import { imageQueue } from '../../worker/queue.js';
import logger from '../../utils/logger.js';
import { AppError, ErrorCodes } from '../../utils/errors.js';

export const uploadImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new AppError('No file attached', 400, ErrorCodes.BAD_REQUEST);
    }

    const jobId = (req as any).jobId;
    const file = req.file;

    // Save metadata to DB with status = pending
    const job = await prisma.imageJob.create({
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
    await imageQueue.add('process-image', {
      jobId,
      filePath: file.path,
    });

    logger.info('Image uploaded and job queued', { jobId, filename: file.originalname });

    return res.status(201).json({
      jobId: job.id,
      status: job.status,
      message: 'Image uploaded successfully. Processing started.',
      uploadedAt: job.uploadedAt,
    });
  } catch (error) {
    next(error);
  }
};

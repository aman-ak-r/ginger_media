import { Queue } from 'bullmq';
import Redis from 'ioredis';
import logger from '../utils/logger.js';

const redisConnection = new (Redis as any)(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const imageQueue = new Queue('image-processing', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

redisConnection.on('error', (err: any) => {
  logger.error('Redis connection error', { error: err.message });
});

logger.info('Queue initialized');

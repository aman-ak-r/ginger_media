import express from 'express';
import dotenv from 'dotenv';
import logger from './utils/logger.js';
import { AppError } from './utils/errors.js';
import uploadRoutes from './api/routes/upload.routes.js';
import resultsRoutes from './api/routes/results.routes.js';

import { rateLimiter } from './api/middleware/rateLimiter.js';

dotenv.config();

const app = express();

app.use(express.json());

// Serve Static Visual Dashboard
app.use(express.static('public'));

// Request logger middleware
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip,
  });
  next();
});

// Routes with rate limiting registered for uploads
app.use('/api/uploads', rateLimiter, uploadRoutes);
app.use('/api/results', resultsRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    error: true,
    code: 'NOT_FOUND',
    message: 'Resource not found',
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const code = err instanceof AppError ? err.code : 'INTERNAL_ERROR';
  const message = err.message || 'Internal server error';

  if (statusCode === 500) {
    logger.error({
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
    jobId: (req as any).jobId || null,
  });
});

export default app;

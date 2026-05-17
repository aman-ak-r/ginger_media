import { Request, Response, NextFunction } from "express";

interface RequestHistory {
  timestamps: number[];
}

const ipHistory = new Map<string, RequestHistory>();

// Limits: Max 10 uploads per minute per IP to prevent spamming
const WINDOW_MS = 60000; // 1 minute window
const MAX_REQUESTS = 10;

export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown-ip";
  const now = Date.now();

  let clientHistory = ipHistory.get(ip);
  if (!clientHistory) {
    clientHistory = { timestamps: [] };
    ipHistory.set(ip, clientHistory);
  }

  // Filter out timestamps outside the sliding window
  clientHistory.timestamps = clientHistory.timestamps.filter((time) => now - time < WINDOW_MS);

  if (clientHistory.timestamps.length >= MAX_REQUESTS) {
    res.status(429).json({
      error: "Too Many Requests",
      message: `Upload rate limit exceeded. Maximum ${MAX_REQUESTS} uploads allowed per minute per IP.`,
      statusCode: 429,
    });
    return;
  }

  clientHistory.timestamps.push(now);
  next();
};

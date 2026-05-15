import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { AppError, ErrorCodes } from '../../utils/errors.js';

// Ensure uploads directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const date = new Date().toISOString().split('T')[0];
    const pathWithDate = path.join(uploadDir, date);
    
    if (!fs.existsSync(pathWithDate)) {
      fs.mkdirSync(pathWithDate, { recursive: true });
    }
    
    cb(null, pathWithDate);
  },
  filename: (req, file, cb) => {
    const jobId = uuidv4();
    (req as any).jobId = jobId;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${jobId}${ext}`);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ['.jpg', '.jpeg', '.png', '.webp', '.heic'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files are accepted (jpg, jpeg, png, webp, heic)', 400, ErrorCodes.INVALID_FILE_TYPE), false);
  }
};

const maxFileSize = (parseInt(process.env.MAX_FILE_SIZE_MB || '10')) * 1024 * 1024;

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxFileSize,
  },
}).single('image');

export const handleMulterError = (err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError(`File too large. Max size is ${process.env.MAX_FILE_SIZE_MB || '10'}MB`, 413, ErrorCodes.FILE_TOO_LARGE));
    }
    return next(new AppError(err.message, 400, ErrorCodes.UPLOAD_FAILED));
  }
  next(err);
};

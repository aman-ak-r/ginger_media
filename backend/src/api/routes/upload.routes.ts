import { Router } from 'express';
import { uploadImage } from '../controllers/upload.controller.js';
import { uploadMiddleware, handleMulterError } from '../middleware/validateUpload.js';
import { getStatus, getResults } from '../controllers/results.controller.js';

const router = Router();

router.post('/', uploadMiddleware, handleMulterError, uploadImage);
router.get('/:jobId/status', getStatus);
router.get('/:jobId/results', getResults);

export default router;


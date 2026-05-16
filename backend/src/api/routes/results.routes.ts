import { Router } from 'express';
import { getStatus, getResults, listUploads } from '../controllers/results.controller.js';

const router = Router();

router.get('/', listUploads);
router.get('/:jobId/status', getStatus);
router.get('/:jobId/results', getResults);

export default router;

import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createSupportReport } from '../controllers/supportController.js';

const router = Router();

router.use(protect);
router.post('/report', createSupportReport);

export default router;

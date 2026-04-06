import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getFriends } from '../controllers/friendRequestController.js';

const router = Router();

router.use(protect);
router.get('/', getFriends);

export default router;

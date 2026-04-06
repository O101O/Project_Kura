import { Router } from 'express';
import { getFavoriteUsers, searchUsers } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);
router.get('/favorites', getFavoriteUsers);
router.get('/search', searchUsers);

export default router;

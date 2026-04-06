import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  acceptFriendRequest,
  getPendingFriendRequests,
  rejectFriendRequest,
  sendFriendRequest
} from '../controllers/friendRequestController.js';

const router = Router();

router.use(protect);
router.post('/send/:id', sendFriendRequest);
router.post('/accept/:id', acceptFriendRequest);
router.post('/reject/:id', rejectFriendRequest);
router.get('/pending', getPendingFriendRequests);

export default router;

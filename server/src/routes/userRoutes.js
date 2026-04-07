import { Router } from 'express';
import { getFavoriteUsers, getSuggestedUsers, searchUsers } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  acceptFriendRequest,
  getFriends,
  sendFriendRequest
} from '../controllers/friendRequestController.js';

const router = Router();

router.use(protect);
router.get('/friends', getFriends);
router.get('/suggestions', getSuggestedUsers);
router.post('/add-friend/:id', sendFriendRequest);
router.post('/accept/:id', acceptFriendRequest);
router.get('/favorites', getFavoriteUsers);
router.get('/search', searchUsers);

export default router;

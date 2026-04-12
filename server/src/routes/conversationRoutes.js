import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getConversations, toggleConversationStar } from '../controllers/conversationController.js';

const router = Router();

router.use(protect);
router.get('/', getConversations);
router.patch('/:id/star', toggleConversationStar);

export default router;

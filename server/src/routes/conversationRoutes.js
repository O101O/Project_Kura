import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getConversations, readConversation, toggleConversationStar } from '../controllers/conversationController.js';

const router = Router();

router.use(protect);
router.get('/', getConversations);
router.patch('/:id/star', toggleConversationStar);
router.patch('/:id/read', readConversation);

export default router;

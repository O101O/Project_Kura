import { Router } from 'express';
import { deleteChat, getMessages, markSeen, sendMessage } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();

router.use(protect);
router.get('/:userId', getMessages);
router.delete('/:userId', deleteChat);
router.patch('/seen/:userId', markSeen);
router.post('/', upload.single('image'), sendMessage);

export default router;

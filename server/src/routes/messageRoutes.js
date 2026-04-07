import { Router } from 'express';
import {
  deleteChat,
  deleteMessage,
  editMessage,
  getMessages,
  getRecentMessages,
  markSeen,
  reactToMessage,
  sendMessage
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';
import { messageUpload } from '../middleware/uploadMiddleware.js';

const router = Router();

router.use(protect);
router.get('/recent', getRecentMessages);
router.delete('/chat/:userId', deleteChat);
router.patch('/seen/:userId', markSeen);
router.post('/:id/react', reactToMessage);
router.put('/:id', editMessage);
router.delete('/:id', deleteMessage);
router.get('/:userId', getMessages);
router.post('/', messageUpload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]), sendMessage);

export default router;

import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { createGroup, getGroupMessages, getGroups, sendGroupMessage } from '../controllers/groupController.js';

const router = Router();

router.use(protect);
router.post('/create', upload.single('groupPic'), createGroup);
router.get('/', getGroups);
router.get('/:id/messages', getGroupMessages);
router.post('/message', upload.single('image'), sendGroupMessage);

export default router;

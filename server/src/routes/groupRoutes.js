import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { messageUpload, upload } from '../middleware/uploadMiddleware.js';
import {
  addGroupMember,
  createGroup,
  deleteGroup,
  getGroupMessages,
  getGroups,
  makeGroupAdmin,
  removeGroupAdmin,
  removeGroupMember,
  sendGroupMessage
} from '../controllers/groupController.js';

const router = Router();

router.use(protect);
router.post('/create', upload.single('groupPic'), createGroup);
router.get('/', getGroups);
router.post('/:groupId/add-member', addGroupMember);
router.post('/:groupId/remove-member', removeGroupMember);
router.post('/:groupId/make-admin', makeGroupAdmin);
router.post('/:groupId/remove-admin', removeGroupAdmin);
router.delete('/:groupId', deleteGroup);
router.get('/:id/messages', getGroupMessages);
router.post('/message', messageUpload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]), sendGroupMessage);

export default router;

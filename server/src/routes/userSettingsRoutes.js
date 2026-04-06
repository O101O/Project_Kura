import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import {
  blockUser,
  changePassword,
  deleteAccount,
  muteUser,
  unblockUser,
  unmuteUser,
  updateNotifications,
  updateProfile,
  updateStatus
} from '../controllers/userSettingsController.js';

const router = Router();

router.use(protect);
router.put('/update-profile', upload.single('profilePic'), updateProfile);
router.put('/change-password', changePassword);
router.put('/status', updateStatus);
router.put('/notifications', updateNotifications);
router.post('/mute/:id', muteUser);
router.post('/unmute/:id', unmuteUser);
router.post('/block/:id', blockUser);
router.post('/unblock/:id', unblockUser);
router.delete('/delete', deleteAccount);

export default router;

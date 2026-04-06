import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Message from '../models/Message.js';
import { uploadImageBuffer } from '../utils/uploadImage.js';
import { emitPresenceUpdates, emitToUser } from '../socket/socketState.js';

const sanitizeUser = (user) => ({
  _id: user._id,
  username: user.username,
  email: user.email,
  profilePic: user.profilePic,
  bio: user.bio,
  status: user.status,
  notifications: user.notifications,
  friends: user.friends,
  friendRequests: user.friendRequests,
  sentRequests: user.sentRequests,
  mutedUsers: user.mutedUsers,
  blockedUsers: user.blockedUsers,
  createdAt: user.createdAt
});

const validateTargetUser = async (currentUserId, targetId) => {
  if (!mongoose.Types.ObjectId.isValid(targetId)) {
    return { error: { status: 400, message: 'Invalid user id' } };
  }

  if (String(currentUserId) === String(targetId)) {
    return { error: { status: 400, message: 'You cannot perform this action on yourself' } };
  }

  const target = await User.findById(targetId).select('_id username');
  if (!target) {
    return { error: { status: 404, message: 'User not found' } };
  }

  return { target };
};

export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { username, bio } = req.body;

    if (username !== undefined) {
      const trimmed = String(username).trim();
      if (trimmed.length < 2 || trimmed.length > 30) {
        return res.status(400).json({ message: 'Username must be between 2 and 30 characters' });
      }
      user.username = trimmed;
    }

    if (bio !== undefined) {
      const nextBio = String(bio).trim();
      if (nextBio.length > 200) {
        return res.status(400).json({ message: 'Bio cannot exceed 200 characters' });
      }
      user.bio = nextBio;
    }

    if (req.file) {
      try {
        user.profilePic = await uploadImageBuffer(req.file.buffer);
      } catch (uploadError) {
        if (uploadError.code === 'CLOUDINARY_NOT_CONFIGURED') {
          return res.status(503).json({ message: 'Image upload is not configured. Add Cloudinary API keys.' });
        }
        if (uploadError.code === 'CLOUDINARY_UPLOAD_FAILED') {
          return res.status(502).json({ message: 'Failed to upload profile image. Please try again.' });
        }
        throw uploadError;
      }
    }

    await user.save();

    res.status(200).json({ message: 'Profile updated', user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: 'All password fields are required' });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['online', 'offline', 'invisible'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = status;
    await user.save();

    for (const friendId of user.friends || []) {
      emitToUser(friendId, 'statusChanged', { userId: String(user._id), status });
      emitToUser(friendId, 'status:changed', { userId: String(user._id), status });
    }

    await emitPresenceUpdates();

    res.status(200).json({ message: 'Status updated', status });
  } catch (error) {
    next(error);
  }
};

export const updateNotifications = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const nextNotifications = {
      messages: req.body.messages ?? user.notifications.messages,
      sounds: req.body.sounds ?? user.notifications.sounds,
      friendRequests: req.body.friendRequests ?? user.notifications.friendRequests
    };

    user.notifications = {
      messages: Boolean(nextNotifications.messages),
      sounds: Boolean(nextNotifications.sounds),
      friendRequests: Boolean(nextNotifications.friendRequests)
    };

    await user.save();

    res.status(200).json({
      message: 'Notification settings updated',
      notifications: user.notifications,
      user: sanitizeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const { confirmText } = req.body;

    if (confirmText !== 'DELETE') {
      return res.status(400).json({ message: 'Confirmation text must be DELETE' });
    }

    await User.deleteOne({ _id: req.user._id });
    await User.updateMany(
      {},
      {
        $pull: {
          friends: req.user._id,
          friendRequests: req.user._id,
          sentRequests: req.user._id
        }
      }
    );

    res.status(200).json({ message: 'Account deleted' });
  } catch (error) {
    next(error);
  }
};

export const muteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, target } = await validateTargetUser(req.user._id, id);

    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { mutedUsers: target._id } },
      { new: true }
    );

    return res.status(200).json({
      message: `${target.username} muted`,
      mutedUsers: user.mutedUsers,
      user: sanitizeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

export const unmuteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, target } = await validateTargetUser(req.user._id, id);

    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { mutedUsers: target._id } },
      { new: true }
    );

    return res.status(200).json({
      message: `${target.username} unmuted`,
      mutedUsers: user.mutedUsers,
      user: sanitizeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

export const blockUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, target } = await validateTargetUser(req.user._id, id);

    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $addToSet: { blockedUsers: target._id },
        $pull: { mutedUsers: target._id }
      },
      { new: true }
    );

    await Message.updateMany(
      {
        $or: [
          { sender: req.user._id, receiver: target._id },
          { sender: target._id, receiver: req.user._id }
        ]
      },
      { $set: { seen: true } }
    );

    await emitPresenceUpdates();

    return res.status(200).json({
      message: `${target.username} blocked`,
      blockedUsers: user.blockedUsers,
      user: sanitizeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

export const unblockUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, target } = await validateTargetUser(req.user._id, id);

    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { blockedUsers: target._id } },
      { new: true }
    );

    await emitPresenceUpdates();

    return res.status(200).json({
      message: `${target.username} unblocked`,
      blockedUsers: user.blockedUsers,
      user: sanitizeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

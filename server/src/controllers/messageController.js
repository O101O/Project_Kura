import Message from '../models/Message.js';
import User from '../models/User.js';
import { uploadImageBuffer } from '../utils/uploadImage.js';
import mongoose from 'mongoose';

const hasUserId = (list, userId) => (list || []).some((id) => String(id) === String(userId));

export const getMessages = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const senderId = req.user?._id;

    console.log('getMessages req.user:', req.user?._id);
    console.log('getMessages userId:', userId);

    if (!senderId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!userId) {
      return res.status(400).json({ message: 'Receiver ID missing' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid receiver ID' });
    }

    const currentUser = await User.findById(senderId).select('friends blockedUsers');
    const otherUser = await User.findById(userId).select('blockedUsers');
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isFriend = (currentUser?.friends || []).some((id) => String(id) === String(userId));
    if (!isFriend) {
      return res.status(403).json({ message: 'You can only access conversations with friends' });
    }

    const messages = await Message.find({
      $or: [
        { sender: senderId, receiver: userId },
        { sender: userId, receiver: senderId }
      ]
    }).sort({ createdAt: 1 });

    console.log('getMessages result count:', messages.length);

    res.status(200).json({ messages });
  } catch (error) {
    console.error('Messages Error:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, text } = req.body;
    const senderId = req.user?._id;

    console.log('sendMessage req.user:', req.user?._id);
    console.log('sendMessage receiverId:', receiverId);

    if (!senderId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!receiverId) {
      return res.status(400).json({ message: 'receiverId is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: 'Invalid receiver ID' });
    }

    if (!text && !req.file) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    const [currentUser, receiver] = await Promise.all([
      User.findById(senderId).select('friends blockedUsers'),
      User.findById(receiverId).select('blockedUsers')
    ]);

    if (!currentUser || !receiver) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isFriend = (currentUser?.friends || []).some((id) => String(id) === String(receiverId));

    if (!isFriend) {
      return res.status(403).json({ message: 'You can only message friends' });
    }

    if (hasUserId(receiver.blockedUsers, senderId) || hasUserId(currentUser.blockedUsers, receiverId)) {
      return res.status(403).json({ message: 'You cannot message this user' });
    }

    let image = '';
    if (req.file) {
      try {
        image = await uploadImageBuffer(req.file.buffer);
      } catch (uploadError) {
        if (uploadError.code === 'CLOUDINARY_NOT_CONFIGURED') {
          return res.status(503).json({ message: 'Image upload is not configured. Add Cloudinary API keys.' });
        }
        if (uploadError.code === 'CLOUDINARY_UPLOAD_FAILED') {
          return res.status(502).json({ message: 'Failed to upload image. Please try again.' });
        }
        throw uploadError;
      }
    }

    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      text: text || '',
      image
    });

    res.status(201).json({ message });
  } catch (error) {
    console.error('Messages Error:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

export const markSeen = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?._id;

    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!userId) {
      return res.status(400).json({ message: 'Receiver ID missing' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid receiver ID' });
    }

    const currentUser = await User.findById(currentUserId).select('friends');
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isFriend = (currentUser?.friends || []).some((id) => String(id) === String(userId));

    if (!isFriend) {
      return res.status(403).json({ message: 'Invalid conversation' });
    }

    await Message.updateMany(
      {
        sender: userId,
        receiver: currentUserId,
        seen: false
      },
      { seen: true }
    );

    res.status(200).json({ message: 'Messages marked as seen' });
  } catch (error) {
    console.error('Messages Error:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

export const deleteChat = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?._id;

    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    await Message.deleteMany({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    });

    return res.status(200).json({ message: 'Chat deleted' });
  } catch (error) {
    console.error('Messages Error:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

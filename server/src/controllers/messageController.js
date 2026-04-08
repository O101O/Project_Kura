import Message from '../models/Message.js';
import User from '../models/User.js';
import Group from '../models/Group.js';
import mongoose from 'mongoose';
import { getUploadedFile } from '../middleware/uploadMiddleware.js';
import { buildUploadUrl } from '../utils/uploadFile.js';
import { emitToGroup, emitToUser } from '../socket/socketState.js';

const hasUserId = (list, userId) => (list || []).some((id) => String(id) === String(userId));
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
const sanitizeText = (value) => String(value ?? '').trim();

const normalizeReplyTo = (replyTo) => {
  if (!replyTo) {
    return null;
  }

  const rawReply = typeof replyTo === 'string' ? JSON.parse(replyTo) : replyTo;
  const messageId = rawReply?.messageId;

  if (!messageId || !isValidObjectId(messageId)) {
    return null;
  }

  return {
    messageId,
    text: sanitizeText(rawReply.text).slice(0, 200),
    sender: sanitizeText(rawReply.sender).slice(0, 80)
  };
};

const hydrateReply = async (replyTo) => {
  const normalizedReply = normalizeReplyTo(replyTo);

  if (!normalizedReply) {
    return null;
  }

  const referencedMessage = await Message.findById(normalizedReply.messageId).populate('sender', 'username');
  if (!referencedMessage) {
    return null;
  }

  return {
    messageId: referencedMessage._id,
    text: sanitizeText(referencedMessage.text || normalizedReply.text).slice(0, 200),
    sender: referencedMessage.sender?.username || normalizedReply.sender || 'Unknown'
  };
};

const emitMessageEvent = (message, event, payload) => {
  if (message?.groupId) {
    emitToGroup(message.groupId?._id || message.groupId, event, payload);
    return;
  }

  const senderId = message?.sender?._id || message?.sender;
  const receiverId = message?.receiver?._id || message?.receiver;

  if (senderId) {
    emitToUser(senderId, event, payload);
  }

  if (receiverId && String(receiverId) !== String(senderId)) {
    emitToUser(receiverId, event, payload);
  }
};

const populateMessageById = (messageId) => Message.findById(messageId)
  .populate('sender', 'username profilePic')
  .populate('receiver', 'username profilePic');

const canAccessMessage = async (message, userId) => {
  const currentUserId = String(userId);

  if (message.groupId) {
    const group = await Group.findOne({ _id: message.groupId, members: userId }).select('_id');
    return Boolean(group);
  }

  return String(message.sender) === currentUserId || String(message.receiver) === currentUserId;
};

const formatRecentMessageTime = (date) => new Date(date).toLocaleString([], {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit'
});

export const getRecentMessages = async (req, res, next) => {
  try {
    const currentUserId = req.user?._id;

    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const messages = await Message.find({
      groupId: null,
      $or: [
        { sender: currentUserId },
        { receiver: currentUserId }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('sender', 'username profilePic')
      .populate('receiver', 'username profilePic');

    const items = messages.map((message) => {
      const isSender = String(message.sender?._id) === String(currentUserId);
      const counterpart = isSender ? message.receiver : message.sender;
      const fallbackName = isSender ? 'Unknown recipient' : 'Unknown sender';

      return {
        _id: message._id,
        title: counterpart?.username || fallbackName,
        preview: message.text?.trim() || (message.image ? 'Shared an image' : 'Started a conversation'),
        timeLabel: formatRecentMessageTime(message.createdAt),
        direction: isSender ? 'sent' : 'received'
      };
    });

    res.status(200).json({ items });
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const senderId = req.user?._id;

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

    res.status(200).json({ messages });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const receiverId = req.body.receiverId;
    const text = String(req.body.text ?? req.body.message ?? '').trim();
    const senderId = req.user?._id;
    const uploadedFile = getUploadedFile(req);

    if (!senderId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!receiverId) {
      return res.status(400).json({ message: 'receiverId is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: 'Invalid receiver ID' });
    }

    if (!text && !uploadedFile) {
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

    const replyTo = await hydrateReply(req.body.replyTo);
    const attachmentUrl = uploadedFile ? buildUploadUrl(req, uploadedFile.filename) : '';
    const attachmentType = uploadedFile?.mimetype || '';
    const attachmentName = uploadedFile?.originalname || '';
    const image = attachmentType.startsWith('image/') ? attachmentUrl : '';

    const createdMessage = await Message.create({
      sender: senderId,
      receiver: receiverId,
      text,
      image,
      attachmentUrl,
      attachmentType,
      attachmentName,
      replyTo
    });

    const message = await populateMessageById(createdMessage._id);
    emitMessageEvent(message, 'message:new', message);

    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
};

export const reactToMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const emoji = sanitizeText(req.body.emoji);
    const currentUserId = req.user?._id;

    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid message id' });
    }

    if (!emoji) {
      return res.status(400).json({ message: 'emoji is required' });
    }

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const allowed = await canAccessMessage(message, currentUserId);
    if (!allowed) {
      return res.status(403).json({ message: 'You do not have access to this message' });
    }

    const currentUserIdString = String(currentUserId);
    const existingIndex = (message.reactions || []).findIndex((reaction) => String(reaction.userId) === currentUserIdString);

    if (existingIndex >= 0) {
      if (message.reactions[existingIndex].emoji === emoji) {
        message.reactions.splice(existingIndex, 1);
      } else {
        message.reactions[existingIndex].emoji = emoji;
      }
    } else {
      message.reactions.push({ userId: currentUserId, emoji });
    }

    await message.save();

    const populatedMessage = await populateMessageById(id);
    emitMessageEvent(populatedMessage, 'message:reaction', populatedMessage);

    return res.status(200).json({ message: populatedMessage });
  } catch (error) {
    next(error);
  }
};

export const editMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const text = sanitizeText(req.body.text);
    const currentUserId = req.user?._id;

    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid message id' });
    }

    if (!text) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const allowed = await canAccessMessage(message, currentUserId);
    if (!allowed) {
      return res.status(403).json({ message: 'You do not have access to this message' });
    }

    if (String(message.sender) !== String(currentUserId)) {
      return res.status(403).json({ message: 'You can only edit your own messages' });
    }

    message.text = text;
    message.isEdited = true;
    await message.save();

    const populatedMessage = await populateMessageById(id);
    emitMessageEvent(populatedMessage, 'message:edited', populatedMessage);

    return res.status(200).json({ message: populatedMessage });
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?._id;

    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid message id' });
    }

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const allowed = await canAccessMessage(message, currentUserId);
    if (!allowed) {
      return res.status(403).json({ message: 'You do not have access to this message' });
    }

    if (String(message.sender) !== String(currentUserId)) {
      return res.status(403).json({ message: 'You can only unsend your own messages' });
    }

    const payload = {
      messageId: String(message._id),
      sender: String(message.sender),
      receiver: message.receiver ? String(message.receiver) : null,
      groupId: message.groupId ? String(message.groupId) : null
    };

    await Message.deleteOne({ _id: id });
    emitMessageEvent(message, 'message:deleted', payload);

    return res.status(200).json(payload);
  } catch (error) {
    next(error);
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
    next(error);
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
    next(error);
  }
};

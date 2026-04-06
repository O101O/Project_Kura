import mongoose from 'mongoose';
import Group from '../models/Group.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { uploadImageBuffer } from '../utils/uploadImage.js';
import { emitToUser, emitPresenceUpdates, emitToGroup } from '../socket/socketState.js';

const asString = (value) => String(value);
const uniqueIds = (values) => Array.from(new Set((values || []).map((value) => asString(value))));

const mapGroup = (group, currentUserId) => ({
  _id: group._id,
  name: group.name,
  groupPic: group.groupPic,
  admin: group.admin?._id || group.admin,
  adminName: group.admin?.username || '',
  members: (group.members || []).map((member) => ({
    _id: member._id,
    username: member.username,
    profilePic: member.profilePic,
    status: member.status
  })),
  memberCount: group.members?.length || 0,
  type: 'group',
  isAdmin: String(group.admin?._id || group.admin) === String(currentUserId)
});

export const createGroup = async (req, res, next) => {
  try {
    const currentUserId = String(req.user._id);
    const rawMembers = Array.isArray(req.body.members)
      ? req.body.members
      : typeof req.body.members === 'string'
        ? JSON.parse(req.body.members)
        : [];
    const name = String(req.body.name || '').trim();

    if (!name) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    const memberIds = uniqueIds([currentUserId, ...rawMembers]);

    if (memberIds.length < 2) {
      return res.status(400).json({ message: 'Select at least one member' });
    }

    const validMembers = memberIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validMembers.length !== memberIds.length) {
      return res.status(400).json({ message: 'Invalid member selection' });
    }

    const currentUser = await User.findById(currentUserId).select('friends blockedUsers');
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentFriends = new Set((currentUser.friends || []).map(asString));
    const currentBlocked = new Set((currentUser.blockedUsers || []).map(asString));
    const requestedOthers = validMembers.filter((id) => id !== currentUserId);

    if (requestedOthers.some((id) => !currentFriends.has(id))) {
      return res.status(403).json({ message: 'You can only create groups with friends' });
    }

    if (requestedOthers.some((id) => currentBlocked.has(id))) {
      return res.status(403).json({ message: 'Unblock users before adding them to a group' });
    }

    const users = await User.find({ _id: { $in: validMembers } }).select('username profilePic status blockedUsers');
    const usersById = new Map(users.map((user) => [String(user._id), user]));

    for (const memberId of requestedOthers) {
      const member = usersById.get(memberId);
      if (!member) {
        return res.status(404).json({ message: 'One or more selected users were not found' });
      }

      const memberBlocked = new Set((member.blockedUsers || []).map(asString));
      if (memberBlocked.has(currentUserId)) {
        return res.status(403).json({ message: 'Cannot add a user who has blocked you' });
      }
    }

    let groupPic = '';
    if (req.file) {
      try {
        groupPic = await uploadImageBuffer(req.file.buffer);
      } catch (uploadError) {
        if (uploadError.code === 'CLOUDINARY_NOT_CONFIGURED') {
          return res.status(503).json({ message: 'Image upload is not configured. Add Cloudinary API keys.' });
        }
        if (uploadError.code === 'CLOUDINARY_UPLOAD_FAILED') {
          return res.status(502).json({ message: 'Failed to upload group image. Please try again.' });
        }
        throw uploadError;
      }
    }

    const group = await Group.create({
      name,
      members: validMembers,
      admin: currentUserId,
      groupPic
    });

    const populatedGroup = await Group.findById(group._id)
      .populate('admin', 'username')
      .populate('members', 'username profilePic status');

    for (const memberId of validMembers) {
      emitToUser(memberId, 'group:created', { group: mapGroup(populatedGroup, memberId) });
    }

    await emitPresenceUpdates();

    return res.status(201).json({
      message: 'Group created',
      group: mapGroup(populatedGroup, currentUserId)
    });
  } catch (error) {
    next(error);
  }
};

export const getGroups = async (req, res, next) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate('admin', 'username')
      .populate('members', 'username profilePic status')
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      groups: groups.map((group) => mapGroup(group, req.user._id))
    });
  } catch (error) {
    next(error);
  }
};

export const getGroupMessages = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid group id' });
    }

    const group = await Group.findOne({ _id: id, members: req.user._id });
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const messages = await Message.find({ groupId: id })
      .populate('sender', 'username profilePic')
      .sort({ createdAt: 1 });

    return res.status(200).json({ messages });
  } catch (error) {
    next(error);
  }
};

export const sendGroupMessage = async (req, res, next) => {
  try {
    const { groupId, text } = req.body;

    if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: 'Valid groupId is required' });
    }

    if (!text && !req.file) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    const group = await Group.findOne({ _id: groupId, members: req.user._id }).populate('members', 'blockedUsers');
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const senderId = String(req.user._id);
    const blockedMember = (group.members || []).find((member) => {
      if (String(member._id) === senderId) {
        return false;
      }

      return (member.blockedUsers || []).some((blockedId) => String(blockedId) === senderId);
    });

    if (blockedMember) {
      return res.status(403).json({ message: 'A group member has blocked you' });
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
      sender: req.user._id,
      groupId,
      text: text || '',
      image
    });

    const populatedMessage = await Message.findById(message._id).populate('sender', 'username profilePic');
    await Group.updateOne({ _id: groupId }, { $set: { updatedAt: new Date() } });
    emitToGroup(groupId, 'newGroupMessage', populatedMessage);

    return res.status(201).json({ message: populatedMessage });
  } catch (error) {
    next(error);
  }
};

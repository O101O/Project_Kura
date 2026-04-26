import mongoose from 'mongoose';
import Group from '../models/Group.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { getUploadedFile } from '../middleware/uploadMiddleware.js';
import { buildUploadUrl } from '../utils/uploadFile.js';
import { uploadImageBuffer } from '../utils/uploadImage.js';
import { emitToUser, emitPresenceUpdates, emitToGroup } from '../socket/socketState.js';
import { upsertGroupConversations } from '../utils/conversationUtils.js';

const asString = (value) => String(value);
const toIdString = (value) => asString(value?._id || value);
const uniqueIds = (values) => Array.from(new Set((values || []).map((value) => toIdString(value))));
const getAdminIds = (group) => uniqueIds(
  Array.isArray(group?.admin) && group.admin.length > 0
    ? group.admin
    : group?.admin
      ? [group.admin]
      : []
);
const isGroupAdmin = (group, userId) => getAdminIds(group).includes(asString(userId));
const sanitizeText = (value) => String(value ?? '').trim();

const normalizeReplyTo = (replyTo) => {
  if (!replyTo) {
    return null;
  }

  const rawReply = typeof replyTo === 'string' ? JSON.parse(replyTo) : replyTo;
  const messageId = rawReply?.messageId;

  if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
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

const mapGroup = (group, currentUserId) => ({
  _id: group._id,
  name: group.name,
  groupPic: group.groupPic,
  admin: getAdminIds(group),
  adminDetails: (Array.isArray(group.admin) ? group.admin : []).map((adminUser) => ({
    _id: adminUser._id,
    username: adminUser.username
  })),
  members: (group.members || []).map((member) => ({
    _id: member._id,
    username: member.username,
    profilePic: member.profilePic,
    status: member.status
  })),
  memberCount: group.members?.length || 0,
  type: 'group',
  isAdmin: isGroupAdmin(group, currentUserId)
});

const populateGroup = (groupId) => Group.findById(groupId)
  .populate('admin', 'username')
  .populate('members', 'username profilePic status blockedUsers');

const populateGroupForAdmin = (groupId, userId) => Group.findOne({
  _id: groupId,
  members: userId,
  $or: [
    { admin: userId },
    { admin: { $in: [userId] } }
  ]
})
  .populate('admin', 'username')
  .populate('members', 'username profilePic status blockedUsers');

const ensureGroupMembership = (group, userId) => (group.members || []).some((member) => toIdString(member) === asString(userId));

const ensureAdminAccess = (group, userId, message) => {
  if (!isGroupAdmin(group, userId)) {
    return { ok: false, status: 403, message };
  }

  return { ok: true };
};

const emitGroupUpdate = async (groupId, actorId, extraRecipients = []) => {
  const populatedGroup = await populateGroup(groupId);
  if (!populatedGroup) {
    return null;
  }

  emitToGroup(groupId, 'groupUpdated', { group: mapGroup(populatedGroup, actorId) });

  const recipients = uniqueIds([
    ...getAdminIds(populatedGroup),
    ...(populatedGroup.members || []).map((member) => toIdString(member)),
    ...extraRecipients
  ]);

  for (const userId of recipients) {
    emitToUser(userId, 'groupUpdated', { group: mapGroup(populatedGroup, userId) });
  }

  return populatedGroup;
};

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
      admin: [currentUserId],
      groupPic
    });

    const populatedGroup = await populateGroup(group._id);

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
    const groupId = req.body.groupId;
    const text = sanitizeText(req.body.text ?? req.body.message);
    const uploadedFile = getUploadedFile(req);

    if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: 'Valid groupId is required' });
    }

    if (!text && !uploadedFile) {
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

    const replyTo = await hydrateReply(req.body.replyTo);
    const attachmentUrl = uploadedFile ? buildUploadUrl(req, uploadedFile.filename) : '';
    const attachmentType = uploadedFile?.mimetype || '';
    const attachmentName = uploadedFile?.originalname || '';
    const image = attachmentType.startsWith('image/') ? attachmentUrl : '';

    const message = await Message.create({
      sender: req.user._id,
      groupId,
      text,
      image,
      attachmentUrl,
      attachmentType,
      attachmentName,
      replyTo
    });

    const populatedMessage = await Message.findById(message._id).populate('sender', 'username profilePic');
    await Group.updateOne({ _id: groupId }, { $set: { updatedAt: new Date() } });
    emitToGroup(groupId, 'newGroupMessage', populatedMessage);
    await upsertGroupConversations({
      groupId,
      senderId: req.user._id,
      memberIds: (group.members || []).map((member) => member._id),
      message: populatedMessage
    });

    return res.status(201).json({ message: populatedMessage });
  } catch (error) {
    next(error);
  }
};

export const addGroupMember = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const currentUserId = asString(req.user._id);

    if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid group or user id' });
    }

    const group = await populateGroupForAdmin(groupId, currentUserId);
    if (!group) {
      const memberGroup = await populateGroup(groupId);
      if (memberGroup && ensureGroupMembership(memberGroup, currentUserId)) {
        return res.status(403).json({ message: 'Only admin can add members' });
      }
      return res.status(404).json({ message: 'Group not found' });
    }

    if (ensureGroupMembership(group, userId)) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    const currentUser = await User.findById(currentUserId).select('friends blockedUsers');
    const userToAdd = await User.findById(userId).select('username blockedUsers');

    if (!currentUser || !userToAdd) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentFriends = new Set((currentUser.friends || []).map(asString));
    if (!currentFriends.has(asString(userId))) {
      return res.status(403).json({ message: 'You can only add friends to the group' });
    }

    const currentBlocked = new Set((currentUser.blockedUsers || []).map(asString));
    const userBlocked = new Set((userToAdd.blockedUsers || []).map(asString));
    if (currentBlocked.has(asString(userId)) || userBlocked.has(currentUserId)) {
      return res.status(403).json({ message: 'Cannot add this user to the group' });
    }

    group.members.push(userId);
    await group.save();

    const updatedGroup = await emitGroupUpdate(groupId, currentUserId, [userId]);
    emitToUser(userId, 'group:created', { group: mapGroup(updatedGroup, userId) });

    return res.status(200).json({
      message: 'User added',
      group: mapGroup(updatedGroup, currentUserId)
    });
  } catch (error) {
    next(error);
  }
};

export const removeGroupMember = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const currentUserId = asString(req.user._id);

    if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid group or user id' });
    }

    const group = await populateGroupForAdmin(groupId, currentUserId);
    if (!group) {
      const memberGroup = await populateGroup(groupId);
      if (memberGroup && ensureGroupMembership(memberGroup, currentUserId)) {
        return res.status(403).json({ message: 'Only admin can remove members' });
      }
      return res.status(404).json({ message: 'Group not found' });
    }

    if (asString(userId) === currentUserId) {
      return res.status(400).json({ message: 'Admins cannot remove themselves' });
    }

    if (!ensureGroupMembership(group, userId)) {
      return res.status(404).json({ message: 'User is not a member of this group' });
    }

    group.members = (group.members || []).filter((member) => toIdString(member) !== asString(userId));
    group.admin = getAdminIds(group).filter((adminId) => adminId !== asString(userId));
    await group.save();

    const updatedGroup = await emitGroupUpdate(groupId, currentUserId, [userId]);
    emitToUser(userId, 'groupRemoved', { groupId: asString(groupId) });

    return res.status(200).json({
      message: 'User removed',
      group: mapGroup(updatedGroup, currentUserId)
    });
  } catch (error) {
    next(error);
  }
};

export const makeGroupAdmin = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const currentUserId = asString(req.user._id);

    if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid group or user id' });
    }

    const group = await populateGroupForAdmin(groupId, currentUserId);
    if (!group) {
      const memberGroup = await populateGroup(groupId);
      if (memberGroup && ensureGroupMembership(memberGroup, currentUserId)) {
        return res.status(403).json({ message: 'Only admin can update admins' });
      }
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!ensureGroupMembership(group, userId)) {
      return res.status(404).json({ message: 'User is not a member of this group' });
    }

    if (isGroupAdmin(group, userId)) {
      return res.status(400).json({ message: 'User is already an admin' });
    }

    group.admin = [...getAdminIds(group), asString(userId)];
    await group.save();

    const updatedGroup = await emitGroupUpdate(groupId, currentUserId, [userId]);

    return res.status(200).json({
      message: 'Admin updated',
      group: mapGroup(updatedGroup, currentUserId)
    });
  } catch (error) {
    next(error);
  }
};

export const removeGroupAdmin = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const currentUserId = asString(req.user._id);

    if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid group or user id' });
    }

    const group = await populateGroupForAdmin(groupId, currentUserId);
    if (!group) {
      const memberGroup = await populateGroup(groupId);
      if (memberGroup && ensureGroupMembership(memberGroup, currentUserId)) {
        return res.status(403).json({ message: 'Only admin can update admins' });
      }
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!isGroupAdmin(group, userId)) {
      return res.status(400).json({ message: 'User is not an admin' });
    }

    const nextAdmins = getAdminIds(group).filter((adminId) => adminId !== asString(userId));
    if (nextAdmins.length === 0) {
      return res.status(400).json({ message: 'Group must have at least one admin' });
    }

    group.admin = nextAdmins;
    await group.save();

    const updatedGroup = await emitGroupUpdate(groupId, currentUserId, [userId]);

    return res.status(200).json({
      message: 'Admin updated',
      group: mapGroup(updatedGroup, currentUserId)
    });
  } catch (error) {
    next(error);
  }
};

export const deleteGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const currentUserId = asString(req.user._id);

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: 'Invalid group id' });
    }

    const group = await populateGroupForAdmin(groupId, currentUserId);
    if (!group) {
      const memberGroup = await populateGroup(groupId);
      if (memberGroup && ensureGroupMembership(memberGroup, currentUserId)) {
        return res.status(403).json({ message: 'Only admin can delete groups' });
      }
      return res.status(404).json({ message: 'Group not found' });
    }

    const memberIds = (group.members || []).map((member) => toIdString(member));

    await Message.deleteMany({ groupId });
    await Group.deleteOne({ _id: groupId });

    for (const memberId of memberIds) {
      emitToUser(memberId, 'groupRemoved', { groupId: asString(groupId) });
    }

    return res.status(200).json({ message: 'Group deleted', groupId: asString(groupId) });
  } catch (error) {
    next(error);
  }
};

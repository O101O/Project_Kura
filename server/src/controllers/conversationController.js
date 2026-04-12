import Conversation from '../models/Conversation.js';
import Group from '../models/Group.js';
import User from '../models/User.js';

const mapConversation = (conversation, currentUserId) => {
  if (!conversation) {
    return null;
  }

  if (conversation.type === 'group') {
    const group = conversation.group;
    return {
      _id: conversation._id,
      type: 'group',
      groupId: group?._id || conversation.group,
      name: group?.name,
      groupPic: group?.groupPic,
      memberCount: group?.members?.length || 0,
      isAdmin: Array.isArray(group?.admin) && group.admin.some((id) => String(id) === String(currentUserId)),
      isStarred: conversation.isStarred,
      lastPreview: conversation.lastPreview,
      lastAt: conversation.lastAt
    };
  }

  const peer = conversation.peerUser;
  return {
    _id: conversation._id,
    type: 'direct',
    peerUserId: peer?._id || conversation.peerUser,
    username: peer?.username,
    profilePic: peer?.profilePic,
    status: peer?.status,
    bio: peer?.bio,
    isStarred: conversation.isStarred,
    lastPreview: conversation.lastPreview,
    lastAt: conversation.lastAt
  };
};

const seedConversationsForUser = async (userId) => {
  const currentUser = await User.findById(userId).select('friends');
  if (!currentUser) {
    return;
  }

  const [groups, existingConversations] = await Promise.all([
    Group.find({ members: userId }).select('_id'),
    Conversation.find({ owner: userId }).select('type peerUser group')
  ]);

  const existingDirect = new Set(
    existingConversations
      .filter((conv) => conv.type === 'direct' && conv.peerUser)
      .map((conv) => String(conv.peerUser))
  );
  const existingGroups = new Set(
    existingConversations
      .filter((conv) => conv.type === 'group' && conv.group)
      .map((conv) => String(conv.group))
  );

  const inserts = [];

  (currentUser.friends || []).forEach((friendId) => {
    if (!existingDirect.has(String(friendId))) {
      inserts.push({
        owner: userId,
        type: 'direct',
        peerUser: friendId,
        isStarred: false
      });
    }
  });

  (groups || []).forEach((group) => {
    if (!existingGroups.has(String(group._id))) {
      inserts.push({
        owner: userId,
        type: 'group',
        group: group._id,
        isStarred: false
      });
    }
  });

  if (inserts.length > 0) {
    try {
      await Conversation.insertMany(inserts, { ordered: false });
    } catch (error) {
      // Ignore duplicate key errors from racing inserts.
      if (error?.code !== 11000) {
        throw error;
      }
    }
  }
};

export const getConversations = async (req, res, next) => {
  try {
    await seedConversationsForUser(req.user._id);

    const filter = { owner: req.user._id };
    if (req.query.starred === 'true') {
      filter.isStarred = true;
    }

    const conversations = await Conversation.find(filter)
      .populate('peerUser', 'username profilePic status bio')
      .populate('group', 'name groupPic members admin')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      conversations: conversations.map((conv) => mapConversation(conv, req.user._id)).filter(Boolean)
    });
  } catch (error) {
    next(error);
  }
};

export const toggleConversationStar = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      owner: req.user._id
    })
      .populate('peerUser', 'username profilePic status bio')
      .populate('group', 'name groupPic members admin');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    conversation.isStarred = !conversation.isStarred;
    await conversation.save();

    return res.status(200).json({
      conversation: mapConversation(conversation, req.user._id)
    });
  } catch (error) {
    next(error);
  }
};

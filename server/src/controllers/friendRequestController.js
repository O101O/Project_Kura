import mongoose from 'mongoose';
import User from '../models/User.js';
import { emitToUser, isUserOnline } from '../socket/socketState.js';

const asStringSet = (arr) => new Set((arr || []).map((id) => String(id)));

const publicUser = (user) => ({
  _id: user._id,
  name: user.username,
  username: user.username,
  email: user.email,
  profilePic: user.profilePic,
  bio: user.bio,
  status: user.status
});

const getLiveStatus = (user, isBlocked = false, hasBlockedCurrentUser = false) => {
  if (isBlocked || hasBlockedCurrentUser) {
    return 'offline';
  }

  if (!isUserOnline(user._id)) {
    return 'offline';
  }

  if (user.status === 'offline' || user.status === 'invisible') {
    return user.status;
  }

  return 'online';
};

const establishFriendship = async (userAId, userBId) => {
  await Promise.all([
    User.updateOne(
      { _id: userAId },
      {
        $addToSet: { friends: userBId },
        $pull: { friendRequests: userBId, sentRequests: userBId }
      }
    ),
    User.updateOne(
      { _id: userBId },
      {
        $addToSet: { friends: userAId },
        $pull: { friendRequests: userAId, sentRequests: userAId }
      }
    )
  ]);
};

export const sendFriendRequest = async (req, res, next) => {
  try {
    const recipientId = req.params.id;
    const senderId = String(req.user._id);

    if (!recipientId) {
      return res.status(400).json({ message: 'Recipient id is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ message: 'Invalid recipient id' });
    }

    if (senderId === recipientId) {
      return res.status(400).json({ message: 'Cannot send request to yourself' });
    }

    const [sender, recipient] = await Promise.all([
      User.findById(senderId).select('username email profilePic bio status friends friendRequests sentRequests blockedUsers'),
      User.findById(recipientId).select('username email profilePic bio status friendRequests sentRequests blockedUsers')
    ]);

    if (!sender) {
      return res.status(401).json({ message: 'Unauthorized user' });
    }

    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    if ((sender.blockedUsers || []).some((id) => String(id) === recipientId)) {
      return res.status(403).json({ message: 'Unblock this user before sending a request' });
    }

    if ((recipient.blockedUsers || []).some((id) => String(id) === senderId)) {
      return res.status(403).json({ message: 'You cannot send a request to this user' });
    }

    const senderFriends = asStringSet(sender.friends);
    const senderSentRequests = asStringSet(sender.sentRequests);
    const senderIncoming = asStringSet(sender.friendRequests);

    if (senderFriends.has(recipientId)) {
      return res.status(409).json({ message: 'Already friends' });
    }

    if (senderSentRequests.has(recipientId)) {
      return res.status(409).json({ message: 'Friend request already sent' });
    }

    if (senderIncoming.has(recipientId)) {
      await establishFriendship(sender._id, recipient._id);

      emitToUser(sender._id, 'friend-request:accepted', { by: publicUser(recipient), autoAccepted: true });
      emitToUser(recipient._id, 'friend-request:accepted', { by: publicUser(sender), autoAccepted: true });
      emitToUser(sender._id, 'friend-request:updated', {});
      emitToUser(recipient._id, 'friend-request:updated', {});

      return res.status(200).json({
        message: 'Friend request accepted',
        autoAccepted: true,
        friend: publicUser(recipient)
      });
    }

    await Promise.all([
      User.updateOne({ _id: sender._id }, { $addToSet: { sentRequests: recipient._id } }),
      User.updateOne({ _id: recipient._id }, { $addToSet: { friendRequests: sender._id } })
    ]);

    emitToUser(recipient._id, 'friend-request:new', {
      from: publicUser(sender)
    });

    emitToUser(sender._id, 'friend-request:updated', {});

    return res.status(200).json({
      message: 'Friend request sent'
    });
  } catch (error) {
    next(error);
  }
};

export const acceptFriendRequest = async (req, res, next) => {
  try {
    const requesterId = req.params.id;
    const currentUserId = String(req.user._id);

    if (!mongoose.Types.ObjectId.isValid(requesterId)) {
      return res.status(400).json({ message: 'Invalid requester id' });
    }

    const requester = await User.findById(requesterId).select('username email profilePic bio status');

    if (!requester) {
      return res.status(404).json({ message: 'Requester not found' });
    }

    const pullResult = await User.updateOne(
      { _id: currentUserId, friendRequests: requesterId },
      {
        $pull: { friendRequests: requesterId, sentRequests: requesterId },
        $addToSet: { friends: requesterId }
      }
    );

    if (pullResult.modifiedCount === 0) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    await User.updateOne(
      { _id: requesterId },
      {
        $pull: { sentRequests: currentUserId, friendRequests: currentUserId },
        $addToSet: { friends: currentUserId }
      }
    );

    emitToUser(requester._id, 'friend-request:accepted', {
      by: {
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        profilePic: req.user.profilePic,
        bio: req.user.bio,
        status: req.user.status
      }
    });

    emitToUser(requester._id, 'friend-request:updated', {});
    emitToUser(currentUserId, 'friend-request:updated', {});

    return res.status(200).json({
      message: 'Friend request accepted',
      friend: publicUser(requester)
    });
  } catch (error) {
    next(error);
  }
};

export const rejectFriendRequest = async (req, res, next) => {
  try {
    const requesterId = req.params.id;
    const currentUserId = String(req.user._id);

    if (!mongoose.Types.ObjectId.isValid(requesterId)) {
      return res.status(400).json({ message: 'Invalid requester id' });
    }

    const requester = await User.findById(requesterId).select('username email profilePic bio status');

    if (!requester) {
      return res.status(404).json({ message: 'Requester not found' });
    }

    const updateResult = await User.updateOne(
      { _id: currentUserId, friendRequests: requesterId },
      { $pull: { friendRequests: requesterId, sentRequests: requesterId } }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    await User.updateOne(
      { _id: requesterId },
      { $pull: { sentRequests: currentUserId, friendRequests: currentUserId } }
    );

    emitToUser(requester._id, 'friend-request:rejected', {
      by: {
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        profilePic: req.user.profilePic,
        bio: req.user.bio,
        status: req.user.status
      }
    });

    emitToUser(currentUserId, 'friend-request:updated', {});
    emitToUser(requester._id, 'friend-request:updated', {});

    return res.status(200).json({ message: 'Friend request rejected' });
  } catch (error) {
    next(error);
  }
};

export const getPendingFriendRequests = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friendRequests', 'username email profilePic bio status')
      .select('friendRequests sentRequests friends');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const pending = (user.friendRequests || []).map((requester) => {
      const status = getLiveStatus(requester);

      return {
        _id: requester._id,
        name: requester.username,
        username: requester.username,
        email: requester.email,
        profilePic: requester.profilePic,
        bio: requester.bio,
        status,
        online: status === 'online',
        isOnline: status === 'online'
      };
    });

    return res.status(200).json({
      pending,
      pendingCount: user.friendRequests.length,
      sentRequests: (user.sentRequests || []).map((id) => String(id)),
      friends: (user.friends || []).map((id) => String(id))
    });
  } catch (error) {
    next(error);
  }
};

export const getFriends = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friends', 'username email profilePic bio status blockedUsers')
      .select('friends blockedUsers mutedUsers');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const blockedSet = new Set((user.blockedUsers || []).map((id) => String(id)));
    const mutedSet = new Set((user.mutedUsers || []).map((id) => String(id)));
    const friends = (user.friends || []).map((friend) => {
      const hasBlockedCurrentUser = (friend.blockedUsers || []).some((id) => String(id) === String(req.user._id));
      const status = getLiveStatus(friend, blockedSet.has(String(friend._id)), hasBlockedCurrentUser);

      return {
        _id: friend._id,
        name: friend.username,
        username: friend.username,
        email: friend.email,
        profilePic: friend.profilePic,
        bio: friend.bio,
        status,
        online: status === 'online',
        isOnline: status === 'online',
        isMuted: mutedSet.has(String(friend._id)),
        isBlocked: blockedSet.has(String(friend._id)),
        hasBlockedYou: hasBlockedCurrentUser,
        type: 'direct'
      };
    });

    return res.status(200).json({ friends });
  } catch (error) {
    next(error);
  }
};

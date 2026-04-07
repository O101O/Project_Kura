import User from '../models/User.js';
import { isUserOnline } from '../socket/socketState.js';

const getPublicName = (user) => user.username || user.name || 'Unknown user';

const getSafeStatus = (user, blockedSet, currentUserId) => {
  const hasBlockedCurrentUser = (user.blockedUsers || []).some((blockedId) => String(blockedId) === String(currentUserId));

  if (blockedSet.has(String(user._id)) || hasBlockedCurrentUser) {
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

export const searchUsers = async (req, res, next) => {
  try {
    const query = (req.query.q || '').trim();

    const [currentUser, users] = await Promise.all([
      User.findById(req.user._id).select('friends friendRequests sentRequests blockedUsers'),
      User.find({
        _id: { $ne: req.user._id },
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ]
      })
        .select('username email profilePic bio status blockedUsers')
        .limit(20)
    ]);

    const friendsSet = new Set((currentUser.friends || []).map((id) => String(id)));
    const sentSet = new Set((currentUser.sentRequests || []).map((id) => String(id)));
    const incomingSet = new Set((currentUser.friendRequests || []).map((id) => String(id)));
    const blockedSet = new Set((currentUser.blockedUsers || []).map((id) => String(id)));

    const usersWithRelationship = users.map((user) => {
      const id = String(user._id);
      const hasBlockedCurrentUser = (user.blockedUsers || []).some((blockedId) => String(blockedId) === String(req.user._id));

      if (blockedSet.has(id) || hasBlockedCurrentUser) {
        return null;
      }

      let relationship = 'none';

      if (friendsSet.has(id)) {
        relationship = 'friends';
      } else if (sentSet.has(id)) {
        relationship = 'pending';
      } else if (incomingSet.has(id)) {
        relationship = 'incoming';
      }

      return {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        bio: user.bio,
        status: hasBlockedCurrentUser ? 'offline' : user.status,
        relationship
      };
    }).filter(Boolean);

    res.status(200).json({ users: usersWithRelationship });
  } catch (error) {
    next(error);
  }
};

export const getFavoriteUsers = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user._id)
      .populate('starredUsers', 'username profilePic bio status')
      .select('starredUsers');

    const users = (currentUser?.starredUsers || []).map((user) => ({
      _id: user._id,
      username: user.username,
      profilePic: user.profilePic,
      bio: user.bio,
      status: user.status
    }));

    res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};

export const getSuggestedUsers = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user._id)
      .select('friends friendRequests sentRequests blockedUsers');

    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const friendsSet = new Set((currentUser.friends || []).map((id) => String(id)));
    const incomingSet = new Set((currentUser.friendRequests || []).map((id) => String(id)));
    const sentSet = new Set((currentUser.sentRequests || []).map((id) => String(id)));
    const blockedSet = new Set((currentUser.blockedUsers || []).map((id) => String(id)));

    const users = await User.find({
      _id: {
        $nin: [req.user._id, ...(currentUser.friends || []), ...(currentUser.blockedUsers || [])]
      }
    })
      .select('username profilePic bio status blockedUsers friends')
      .limit(24);

    const currentFriendIds = new Set((currentUser.friends || []).map((id) => String(id)));

    const suggestions = users
      .filter((user) => !(user.blockedUsers || []).some((blockedId) => String(blockedId) === String(req.user._id)))
      .map((user) => {
        const mutualFriendsCount = (user.friends || []).reduce((count, friendId) => (
          currentFriendIds.has(String(friendId)) ? count + 1 : count
        ), 0);
        const status = getSafeStatus(user, blockedSet, req.user._id);

        return {
          _id: user._id,
          name: getPublicName(user),
          username: user.username,
          profilePic: user.profilePic,
          bio: user.bio,
          online: status === 'online',
          isOnline: status === 'online',
          status,
          mutualFriendsCount,
          requestSent: sentSet.has(String(user._id)),
          hasIncomingRequest: incomingSet.has(String(user._id))
        };
      });

    res.status(200).json({ suggested: suggestions });
  } catch (error) {
    next(error);
  }
};

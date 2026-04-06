import User from '../models/User.js';

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

import User from '../models/User.js';

const userSockets = new Map();
const socketUsers = new Map();
const visiblePresenceByViewer = new Map();
let ioInstance = null;

export const setIO = (io) => {
  ioInstance = io;
};

export const getIO = () => ioInstance;

export const setUserOnline = (userId, socketId) => {
  const key = String(userId);
  const existing = userSockets.get(key) || new Set();
  existing.add(socketId);
  userSockets.set(key, existing);
  socketUsers.set(socketId, key);
};

export const removeSocket = (socketId) => {
  const userId = socketUsers.get(socketId);

  if (!userId) {
    return;
  }

  const sockets = userSockets.get(userId);
  if (!sockets) {
    socketUsers.delete(socketId);
    return;
  }

  sockets.delete(socketId);
  if (sockets.size === 0) {
    userSockets.delete(userId);
  } else {
    userSockets.set(userId, sockets);
  }

  socketUsers.delete(socketId);
};

export const getOnlineUsers = () => Array.from(userSockets.keys());

export const isUserOnline = (userId) => userSockets.has(String(userId));

export const emitToUser = (userId, event, payload) => {
  const io = getIO();
  const sockets = userSockets.get(String(userId));

  if (!io || !sockets || sockets.size === 0) {
    return;
  }

  for (const socketId of sockets) {
    io.to(socketId).emit(event, payload);
  }
};

export const emitToGroup = (groupId, event, payload) => {
  const io = getIO();
  if (!io) {
    return;
  }

  io.to(String(groupId)).emit(event, payload);
};

const isVisibleToViewer = (viewer, candidate) => {
  const viewerFriends = new Set((viewer.friends || []).map((id) => String(id)));
  const viewerBlocked = new Set((viewer.blockedUsers || []).map((id) => String(id)));
  const candidateBlocked = new Set((candidate.blockedUsers || []).map((id) => String(id)));
  const candidateId = String(candidate._id);
  const viewerId = String(viewer._id);

  if (!viewerFriends.has(candidateId)) {
    return false;
  }

  if (viewerBlocked.has(candidateId) || candidateBlocked.has(viewerId)) {
    return false;
  }

  if (candidate.status === 'offline' || candidate.status === 'invisible') {
    return false;
  }

  return userSockets.has(candidateId);
};

export const emitPresenceUpdates = async () => {
  const onlineUserIds = getOnlineUsers();

  if (onlineUserIds.length === 0) {
    visiblePresenceByViewer.clear();
    return;
  }

  const users = await User.find({ _id: { $in: onlineUserIds } }).select('friends blockedUsers status');
  const usersById = new Map(users.map((user) => [String(user._id), user]));
  const viewerIds = new Set(onlineUserIds.map((id) => String(id)));

  for (const existingViewerId of Array.from(visiblePresenceByViewer.keys())) {
    if (!viewerIds.has(existingViewerId)) {
      visiblePresenceByViewer.delete(existingViewerId);
    }
  }

  for (const onlineUserId of onlineUserIds) {
    const viewer = usersById.get(String(onlineUserId));
    if (!viewer) {
      continue;
    }

    const visibleOnlineUsers = onlineUserIds.filter((candidateId) => {
      if (candidateId === String(onlineUserId)) {
        return false;
      }

      const candidate = usersById.get(String(candidateId));
      if (!candidate) {
        return false;
      }

      return isVisibleToViewer(viewer, candidate);
    });

    const previousVisibleUsers = visiblePresenceByViewer.get(String(onlineUserId)) || new Set();
    const nextVisibleUsers = new Set(visibleOnlineUsers.map((id) => String(id)));

    for (const candidateId of nextVisibleUsers) {
      if (!previousVisibleUsers.has(candidateId)) {
        emitToUser(onlineUserId, 'userOnline', candidateId);
      }
    }

    for (const candidateId of previousVisibleUsers) {
      if (!nextVisibleUsers.has(candidateId)) {
        emitToUser(onlineUserId, 'userOffline', candidateId);
      }
    }

    visiblePresenceByViewer.set(String(onlineUserId), nextVisibleUsers);
    emitToUser(onlineUserId, 'presence:update', visibleOnlineUsers);
  }
};

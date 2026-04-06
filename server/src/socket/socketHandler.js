import { emitPresenceUpdates, emitToUser, removeSocket, setUserOnline } from './socketState.js';

export const configureSocket = (io) => {
  io.on('connection', (socket) => {
    socket.on('user:online', (userId) => {
      setUserOnline(userId, socket.id);
      emitPresenceUpdates().catch((error) => {
        console.error('Presence update error:', error);
      });
    });

    socket.on('typing:start', ({ from, to }) => {
      emitToUser(to, 'typing:start', { from });
    });

    socket.on('typing:stop', ({ from, to }) => {
      emitToUser(to, 'typing:stop', { from });
    });

    socket.on('message:send', ({ to, message }) => {
      emitToUser(to, 'message:new', message);
    });

    socket.on('group:join', (groupId) => {
      if (groupId) {
        socket.join(String(groupId));
      }
    });

    socket.on('group:joinMany', (groupIds = []) => {
      for (const groupId of groupIds) {
        if (groupId) {
          socket.join(String(groupId));
        }
      }
    });

    socket.on('disconnect', () => {
      removeSocket(socket.id);
      emitPresenceUpdates().catch((error) => {
        console.error('Presence update error:', error);
      });
    });
  });
};

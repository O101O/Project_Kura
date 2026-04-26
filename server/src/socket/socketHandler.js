import { emitPresenceUpdates, emitToUser, removeSocket, setUserOnline } from './socketState.js';

export const configureSocket = (io) => {
  io.on('connection', (socket) => {
    const forwardTypingStart = ({ from, to, senderId, receiverId }) => {
      const nextSender = senderId || from;
      const nextReceiver = receiverId || to;
      if (!nextSender || !nextReceiver) {
        return;
      }

      const payloadLegacy = { from: nextSender };
      const payloadNext = { senderId: nextSender, receiverId: nextReceiver };
      emitToUser(nextReceiver, 'typing:start', payloadLegacy);
      emitToUser(nextReceiver, 'typing', payloadNext);
    };

    const forwardTypingStop = ({ from, to, senderId, receiverId }) => {
      const nextSender = senderId || from;
      const nextReceiver = receiverId || to;
      if (!nextSender || !nextReceiver) {
        return;
      }

      const payloadLegacy = { from: nextSender };
      const payloadNext = { senderId: nextSender, receiverId: nextReceiver };
      emitToUser(nextReceiver, 'typing:stop', payloadLegacy);
      emitToUser(nextReceiver, 'stop_typing', payloadNext);
    };

    socket.on('user:online', (userId) => {
      setUserOnline(userId, socket.id);
      emitPresenceUpdates().catch((error) => {
        console.error('Presence update error:', error);
      });
    });

    socket.on('typing:start', forwardTypingStart);
    socket.on('typing:stop', forwardTypingStop);
    socket.on('typing', forwardTypingStart);
    socket.on('stop_typing', forwardTypingStop);

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

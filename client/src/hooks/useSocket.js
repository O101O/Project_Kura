import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';

export const useSocket = (userId) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const nextSocket = io(SOCKET_URL);
    setSocket(nextSocket);
    nextSocket.emit('user:online', userId);

    nextSocket.on('presence:update', (users) => {
      setOnlineUsers(users);
    });

    nextSocket.on('userOnline', (nextUserId) => {
      setOnlineUsers((prev) => prev.includes(nextUserId) ? prev : [...prev, nextUserId]);
    });

    nextSocket.on('userOffline', (nextUserId) => {
      setOnlineUsers((prev) => prev.filter((user) => user !== nextUserId));
    });

    return () => {
      nextSocket.disconnect();
      setSocket(null);
      setOnlineUsers([]);
    };
  }, [userId]);

  return { socket, onlineUsers };
};

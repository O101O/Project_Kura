import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export const useSocket = (userId) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const nextSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
    setSocket(nextSocket);
    nextSocket.emit('user:online', userId);

    nextSocket.on('presence:update', (users) => {
      setOnlineUsers(users);
    });

    return () => {
      nextSocket.disconnect();
      setSocket(null);
    };
  }, [userId]);

  return { socket, onlineUsers };
};

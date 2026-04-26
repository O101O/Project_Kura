/**
 * Custom hook for managing Socket.IO connection and real-time events.
 * Handles user presence, online status updates, and socket lifecycle.
 */

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

    // Establish socket connection
    const nextSocket = io(SOCKET_URL);
    setSocket(nextSocket);
    nextSocket.emit('user:online', userId);

    // Listen for presence updates
    nextSocket.on('presence:update', (users) => {
      setOnlineUsers(users);
    });

    // Handle individual user online/offline events
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

import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = (token) => {
  if (socket?.connected) return socket;
  socket = io( import.meta.env.VITE_SOCKET_URL || 'https://bookiverse.onrender.com', {
    auth: { token },
    transports: ['websocket'],
  });
  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};

export const getSocket = () => socket;
import { io } from 'socket.io-client';

const isProduction = process.env.NODE_ENV === 'production';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || (isProduction ? 'https://lecture-booking-system-code.onrender.com' : 'http://localhost:5000');

let socket = null;

export const connectSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socket.on('connect', () => console.log('🔌 Socket connected'));
    socket.on('disconnect', () => console.log('🔌 Socket disconnected'));
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default { connectSocket, getSocket, disconnectSocket };

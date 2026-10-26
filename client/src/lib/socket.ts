import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(token?: string): Socket {
  if (!socket) {
    socket = io('/', {
      auth: {
        token: token || '',
      },
      autoConnect: false,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  } else if (token && socket.auth) {
    socket.auth = { token };
  }

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

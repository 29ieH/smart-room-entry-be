import { Socket } from 'socket.io';

export interface SocketAuth {
  token?: string;
}
export interface SocketData {
  userId: number;
}
export interface AuthedSocket extends Socket {
  data: {
    userId?: number;
  };
}

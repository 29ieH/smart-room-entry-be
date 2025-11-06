import { UnauthorizedException } from '@nestjs/common';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import cookie from 'cookie';
import { Server } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { EMPTY_SOCKET_COUNT } from 'src/common/constant/socket.constant';
import {
  AuthedSocket,
  SocketAuth,
} from 'src/common/types/socket-auth.interface';
import { extractTokenFromSocket } from 'src/common/utils/jwt.util';
import { CustomLogger } from 'src/core/logger.service';
import { VehicleEntryLogSummary } from './dto/vehicle-entry-log-summary';
@WebSocketGateway({
  namespace: '/license-plates',
})
export class LicensePlateGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly authService: AuthService,
    private readonly loggerService: CustomLogger,
  ) {}
  @WebSocketServer() server: Server;
  private onlineUsers = new Map<number, Set<string>>();
  async handleConnection(client: AuthedSocket) {
    try {
      const rawCookie = client.handshake.headers.cookie;
      let fromCookie: string | undefined;
      if (rawCookie) {
        const cookies = cookie?.parse(rawCookie || '');
        fromCookie = cookies['accessToken'];
      }
      const fromAuth = (client.handshake.auth as SocketAuth)?.token;
      // const fromHeader = client.handshake.headers?.authorization;
      const fromHeader = extractTokenFromSocket(
        client.handshake.headers?.authorization,
      );
      const token = fromAuth || fromHeader || fromCookie;
      if (!token) throw new UnauthorizedException('Vui lòng đăng nhập');
      const payload = await this.authService.verifyToken(token);
      const userId = payload.sub;
      const existingSockets = this.onlineUsers.get(userId) || new Set();
      existingSockets.add(client.id);
      this.onlineUsers.set(userId, existingSockets);
      client.data.userId = userId;
    } catch (error) {
      this.loggerService.error(`Error:: ${(error as Error).message}`);
      this.loggerService.error(
        `Connection socket error`,
        JSON.stringify(error),
      );
      client.disconnect();
    }
  }
  handleDisconnect(client: AuthedSocket) {
    const userId = client.data.userId;
    if (userId) {
      const sockets = this.onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === EMPTY_SOCKET_COUNT) {
          this.onlineUsers.delete(userId);
        } else {
          this.onlineUsers.set(userId, sockets);
        }
      }
    }
  }
  isUserOnline(userId: number): boolean {
    return this.onlineUsers.has(userId);
  }
  @SubscribeMessage('join')
  async handleJoin(@ConnectedSocket() client: AuthedSocket) {
    const userId = client.data.userId;
    if (!userId) throw new UnauthorizedException('Vui lòng đăng nhập');
    const existingSockets = this.onlineUsers.get(userId) || new Set();
    existingSockets.add(client.id);
    this.onlineUsers.set(userId, existingSockets);
    await client.join(`user_${userId}`);
    client.emit('joined', { userId });
  }
  sendNewLog(userId: number, payload: VehicleEntryLogSummary) {
    const socketIds = this.onlineUsers.get(userId);
    if (socketIds) {
      for (const socketId of socketIds) {
        this.server.to(socketId).emit('newLog', payload);
      }
    }
  }
}

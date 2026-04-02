import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  constructor(private configService: ConfigService) {}

  /** 클라이언트 연결 시 JWT 검증 → userId로 room 참가 */
  handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const secret = this.configService.get<string>('jwt.accessSecret') || '';
      const payload = jwt.verify(token, secret) as any;
      const userId = payload.sub;

      // userId 기반 room에 참가
      client.join(`user:${userId}`);
      client.data.userId = userId;

      this.logger.log(`클라이언트 연결: ${userId}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.userId) {
      this.logger.log(`클라이언트 해제: ${client.data.userId}`);
    }
  }

  /** 특정 사용자에게 알림 전송 */
  sendToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }

  /** 여러 사용자에게 알림 전송 */
  sendToUsers(userIds: string[], notification: any) {
    for (const userId of userIds) {
      this.server.to(`user:${userId}`).emit('notification', notification);
    }
  }
}

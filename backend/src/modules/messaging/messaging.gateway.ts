import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger, UseGuards } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { SendMessageDto } from './dto/messaging.dto';

@WebSocketGateway({
  namespace: '/messaging',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class MessagingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagingGateway.name);
  private connectedUsers = new Map<string, string[]>(); // userId -> socketIds

  constructor(
    private readonly messagingService: MessagingService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Messaging WebSocket gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      client.data.userId = payload.sub;
      client.data.user = payload;

      // Track connected user
      const existing = this.connectedUsers.get(payload.sub) || [];
      this.connectedUsers.set(payload.sub, [...existing, client.id]);

      // Auto-join user's conversations
      const conversations = await this.messagingService.getConversations(payload.sub);
      for (const conv of conversations) {
        await client.join(`conversation:${conv.id}`);
      }

      this.logger.log(`Client connected: ${client.id} (user: ${payload.sub})`);
      client.emit('connected', { userId: payload.sub });
    } catch (err) {
      this.logger.warn(`Connection rejected: ${err.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      const sockets = (this.connectedUsers.get(userId) || []).filter(
        (id) => id !== client.id,
      );
      if (sockets.length === 0) {
        this.connectedUsers.delete(userId);
      } else {
        this.connectedUsers.set(userId, sockets);
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) throw new WsException('Not authenticated');

    await client.join(`conversation:${data.conversationId}`);
    this.logger.log(`User ${userId} joined conversation ${data.conversationId}`);
    return { joined: data.conversationId };
  }

  @SubscribeMessage('leave_conversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    await client.leave(`conversation:${data.conversationId}`);
    return { left: data.conversationId };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string; attachments?: string[] },
  ) {
    const userId = client.data.userId;
    if (!userId) throw new WsException('Not authenticated');

    try {
      const message = await this.messagingService.sendMessage(
        {
          conversationId: data.conversationId,
          content: data.content,
          attachments: data.attachments,
        },
        userId,
      );

      // Emit to everyone in the conversation room
      this.server
        .to(`conversation:${data.conversationId}`)
        .emit('new_message', message);

      return message;
    } catch (err) {
      throw new WsException(err.message);
    }
  }

  @SubscribeMessage('typing_start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    client.to(`conversation:${data.conversationId}`).emit('user_typing', {
      userId,
      conversationId: data.conversationId,
      isTyping: true,
    });
  }

  @SubscribeMessage('typing_stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    client.to(`conversation:${data.conversationId}`).emit('user_typing', {
      userId,
      conversationId: data.conversationId,
      isTyping: false,
    });
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) throw new WsException('Not authenticated');

    try {
      const result = await this.messagingService.markRead(data.conversationId, userId);
      client.to(`conversation:${data.conversationId}`).emit('messages_read', {
        conversationId: data.conversationId,
        userId,
        readAt: result.readAt,
      });
      return result;
    } catch (err) {
      throw new WsException(err.message);
    }
  }

  // Emit to specific user across all their sockets
  emitToUser(userId: string, event: string, data: any) {
    const socketIds = this.connectedUsers.get(userId) || [];
    for (const socketId of socketIds) {
      this.server.to(socketId).emit(event, data);
    }
  }

  // Emit to a conversation room
  emitToConversation(conversationId: string, event: string, data: any) {
    this.server.to(`conversation:${conversationId}`).emit(event, data);
  }

  // Check if a user is online
  isUserOnline(userId: string): boolean {
    const sockets = this.connectedUsers.get(userId) || [];
    return sockets.length > 0;
  }
}

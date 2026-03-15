import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateConversationDto, SendMessageDto, EditMessageDto } from './dto/messaging.dto';

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
      },
      include: {
        participants: {
          include: { user: { include: { profile: true } } },
        },
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: { include: { profile: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Add unread count per conversation
    const result = await Promise.all(
      conversations.map(async (conv) => {
        const participant = conv.participants.find((p) => p.userId === userId);
        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId: conv.id,
            deletedAt: null,
            senderId: { not: userId },
            createdAt: participant?.lastReadAt
              ? { gt: participant.lastReadAt }
              : undefined,
          },
        });

        return { ...conv, unreadCount };
      }),
    );

    return result;
  }

  async createConversation(dto: CreateConversationDto, creatorId: string) {
    // For direct messages, check if conversation already exists
    if (dto.type === 'DIRECT' && dto.participantIds.length === 1) {
      const otherId = dto.participantIds[0];
      const existing = await this.prisma.conversation.findFirst({
        where: {
          type: 'DIRECT',
          participants: {
            every: {
              userId: { in: [creatorId, otherId] },
            },
          },
        },
        include: {
          participants: { include: { user: { include: { profile: true } } } },
          messages: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (existing && existing.participants.length === 2) {
        return existing;
      }
    }

    const allParticipantIds = Array.from(new Set([creatorId, ...dto.participantIds]));

    const conversation = await this.prisma.conversation.create({
      data: {
        name: dto.name,
        type: dto.type,
        participants: {
          create: allParticipantIds.map((userId) => ({
            userId,
            isAdmin: userId === creatorId,
          })),
        },
      },
      include: {
        participants: { include: { user: { include: { profile: true } } } },
      },
    });

    this.logger.log(`Conversation created: ${conversation.id} by ${creatorId}`);
    return conversation;
  }

  async getMessages(conversationId: string, userId: string, cursor?: string, limit = 50) {
    // Verify user is a participant
    await this.verifyParticipant(conversationId, userId);

    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
        deletedAt: null,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      include: {
        sender: { include: { profile: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    });

    const hasMore = messages.length > limit;
    if (hasMore) messages.pop();

    const nextCursor = hasMore && messages.length > 0
      ? messages[messages.length - 1].createdAt.toISOString()
      : null;

    return {
      messages: messages.reverse(),
      nextCursor,
      hasMore,
    };
  }

  async sendMessage(dto: SendMessageDto, senderId: string) {
    await this.verifyParticipant(dto.conversationId, senderId);

    const message = await this.prisma.message.create({
      data: {
        conversationId: dto.conversationId,
        senderId,
        content: dto.content,
        attachments: dto.attachments || [],
      },
      include: {
        sender: { include: { profile: true } },
      },
    });

    // Update conversation updatedAt
    await this.prisma.conversation.update({
      where: { id: dto.conversationId },
      data: { updatedAt: new Date() },
    });

    this.eventEmitter.emit('message.sent', message);
    return message;
  }

  async editMessage(messageId: string, dto: EditMessageDto, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException(`Message with id ${messageId} not found`);
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    if (message.deletedAt) {
      throw new ForbiddenException('Cannot edit a deleted message');
    }

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: { content: dto.content, isEdited: true },
      include: { sender: { include: { profile: true } } },
    });

    this.eventEmitter.emit('message.edited', updated);
    return updated;
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: { participants: true },
        },
      },
    });

    if (!message) {
      throw new NotFoundException(`Message with id ${messageId} not found`);
    }

    // Allow message sender or conversation admin to delete
    const isAdmin = message.conversation.participants.some(
      (p) => p.userId === userId && p.isAdmin,
    );

    if (message.senderId !== userId && !isAdmin) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    const deleted = await this.prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });

    this.eventEmitter.emit('message.deleted', { messageId, conversationId: message.conversationId });
    return deleted;
  }

  async markRead(conversationId: string, userId: string) {
    await this.verifyParticipant(conversationId, userId);

    await this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      data: { lastReadAt: new Date() },
    });

    return { conversationId, userId, readAt: new Date() };
  }

  private async verifyParticipant(conversationId: string, userId: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    return participant;
  }
}

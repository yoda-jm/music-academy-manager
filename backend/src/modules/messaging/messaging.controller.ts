import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MessagingService } from './messaging.service';
import { CreateConversationDto, EditMessageDto, SendMessageBodyDto } from './dto/messaging.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('messaging')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get('conversations')
  @ApiOperation({ summary: "Get user's conversations with last message and unread count" })
  async getConversations(@CurrentUser() currentUser: any) {
    return this.messagingService.getConversations(currentUser.id);
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Create a direct or group conversation' })
  async createConversation(
    @Body() dto: CreateConversationDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.messagingService.createConversation(dto, currentUser.id);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get messages for a conversation (cursor-based pagination)' })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMessages(
    @Param('id') id: string,
    @CurrentUser() currentUser: any,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ) {
    return this.messagingService.getMessages(id, currentUser.id, cursor, limit ? Number(limit) : 50);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send a message to a conversation' })
  async sendMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageBodyDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.messagingService.sendMessage(
      { conversationId: id, content: dto.content, attachments: dto.attachments },
      currentUser.id,
    );
  }

  @Post('conversations/:id/read')
  @ApiOperation({ summary: 'Mark all messages in a conversation as read' })
  async markRead(
    @Param('id') id: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.messagingService.markRead(id, currentUser.id);
  }

  @Patch('messages/:id')
  @ApiOperation({ summary: 'Edit a message' })
  async editMessage(
    @Param('id') id: string,
    @Body() dto: EditMessageDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.messagingService.editMessage(id, dto, currentUser.id);
  }

  @Delete('messages/:id')
  @ApiOperation({ summary: 'Soft delete a message' })
  async deleteMessage(
    @Param('id') id: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.messagingService.deleteMessage(id, currentUser.id);
  }
}

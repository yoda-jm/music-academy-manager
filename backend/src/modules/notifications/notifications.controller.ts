import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "Get user's notifications" })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  async getNotifications(
    @CurrentUser() currentUser: any,
    @Query() pagination: PaginationDto,
    @Query('isRead') isRead?: string,
  ) {
    const isReadBool =
      isRead !== undefined ? isRead === 'true' : undefined;
    return this.notificationsService.getNotifications(
      currentUser.id,
      pagination,
      isReadBool,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@CurrentUser() currentUser: any) {
    return this.notificationsService.getUnreadCount(currentUser.id);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllRead(@CurrentUser() currentUser: any) {
    return this.notificationsService.markAllRead(currentUser.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markRead(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.notificationsService.markRead(id, currentUser.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  async deleteNotification(
    @Param('id') id: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.notificationsService.deleteNotification(id, currentUser.id);
  }
}

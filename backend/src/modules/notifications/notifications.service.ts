import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { getPaginationParams, paginatedResponse } from '../../common/utils/pagination.util';
import { NotifType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getNotifications(userId: string, pagination: PaginationDto, isRead?: boolean) {
    const { skip, take } = getPaginationParams(pagination);

    const where: any = { userId };
    if (isRead !== undefined) where.isRead = isRead;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return paginatedResponse(notifications, total, pagination.page || 1, take);
  }

  async markRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });

    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }

    if (notification.userId !== userId) {
      throw new NotFoundException(`Notification ${id} not found`);
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { updated: result.count };
  }

  async deleteNotification(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException(`Notification ${id} not found`);
    }

    return this.prisma.notification.delete({ where: { id } });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { count };
  }

  async createNotification(
    userId: string,
    type: NotifType,
    title: string,
    content: string,
    link?: string,
  ) {
    const notification = await this.prisma.notification.create({
      data: { userId, type, title, content, link },
    });

    this.logger.log(`Notification created for user ${userId}: ${title}`);
    return notification;
  }

  async createBulkNotifications(
    userIds: string[],
    type: NotifType,
    title: string,
    content: string,
    link?: string,
  ) {
    const data = userIds.map((userId) => ({
      userId,
      type,
      title,
      content,
      link,
    }));

    const result = await this.prisma.notification.createMany({ data });
    return { created: result.count };
  }

  // Event listeners

  @OnEvent('attendance.marked')
  async handleAttendanceMarked(attendance: any) {
    try {
      const session = await this.prisma.courseSession.findUnique({
        where: { id: attendance.sessionId },
        include: { course: true },
      });

      if (!session) return;

      const student = await this.prisma.student.findUnique({
        where: { id: attendance.studentId },
      });

      if (!student) return;

      await this.createNotification(
        student.userId,
        NotifType.ATTENDANCE_MARKED,
        'Attendance Marked',
        `Your attendance for ${session.course.name} has been marked as ${attendance.status}`,
        `/sessions/${session.id}`,
      );
    } catch (err) {
      this.logger.error('Error handling attendance.marked event', err);
    }
  }

  @OnEvent('invoice.sent')
  async handleInvoiceSent(invoice: any) {
    try {
      if (!invoice.familyId) return;

      const family = await this.prisma.family.findUnique({
        where: { id: invoice.familyId },
        include: { members: { where: { isPrimary: true } } },
      });

      if (!family || family.members.length === 0) return;

      const primaryMember = family.members[0];

      await this.createNotification(
        primaryMember.userId,
        NotifType.INVOICE_DUE,
        'Invoice Sent',
        `Invoice ${invoice.number} for ${Number(invoice.total).toFixed(2)} has been sent. Due: ${new Date(invoice.dueDate).toLocaleDateString()}`,
        `/billing/invoices/${invoice.id}`,
      );
    } catch (err) {
      this.logger.error('Error handling invoice.sent event', err);
    }
  }

  @OnEvent('enrollment.created')
  async handleEnrollmentCreated(enrollment: any) {
    try {
      const student = await this.prisma.student.findUnique({
        where: { id: enrollment.studentId },
        include: { user: true },
      });

      if (!student) return;

      await this.createNotification(
        student.userId,
        NotifType.ENROLLMENT_CHANGE,
        'Enrolled in Course',
        `You have been enrolled in ${enrollment.course?.name || 'a course'}`,
        `/courses/${enrollment.courseId}`,
      );
    } catch (err) {
      this.logger.error('Error handling enrollment.created event', err);
    }
  }

  @OnEvent('enrollment.cancelled')
  async handleEnrollmentCancelled(enrollment: any) {
    try {
      const student = await this.prisma.student.findUnique({
        where: { id: enrollment.studentId },
        include: { user: true },
      });

      if (!student) return;

      await this.createNotification(
        student.userId,
        NotifType.ENROLLMENT_CHANGE,
        'Enrollment Cancelled',
        `Your enrollment has been cancelled`,
        `/courses/${enrollment.courseId}`,
      );
    } catch (err) {
      this.logger.error('Error handling enrollment.cancelled event', err);
    }
  }

  @OnEvent('message.sent')
  async handleMessageSent(message: any) {
    try {
      const participants = await this.prisma.conversationParticipant.findMany({
        where: {
          conversationId: message.conversationId,
          userId: { not: message.senderId },
        },
      });

      if (participants.length === 0) return;

      const userIds = participants.map((p) => p.userId);

      await this.createBulkNotifications(
        userIds,
        NotifType.MESSAGE_RECEIVED,
        'New Message',
        `${message.sender?.profile?.firstName || 'Someone'} sent you a message`,
        `/messaging/${message.conversationId}`,
      );
    } catch (err) {
      this.logger.error('Error handling message.sent event', err);
    }
  }

  @OnEvent('session.cancelled')
  async handleSessionCancelled(session: any) {
    try {
      const enrollments = await this.prisma.enrollment.findMany({
        where: {
          courseId: session.courseId,
          status: 'ACTIVE',
        },
        include: { student: true },
      });

      const userIds = enrollments.map((e) => e.student.userId);

      if (userIds.length === 0) return;

      await this.createBulkNotifications(
        userIds,
        NotifType.SYSTEM,
        'Session Cancelled',
        `A session on ${new Date(session.startTime).toLocaleDateString()} has been cancelled${session.cancelReason ? ': ' + session.cancelReason : ''}`,
        `/sessions/${session.id}`,
      );
    } catch (err) {
      this.logger.error('Error handling session.cancelled event', err);
    }
  }
}

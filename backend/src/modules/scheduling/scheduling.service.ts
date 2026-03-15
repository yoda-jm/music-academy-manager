import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSessionDto } from './dto/scheduling.dto';

@Injectable()
export class SchedulingService {
  private readonly logger = new Logger(SchedulingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getCalendar(
    startDate: Date,
    endDate: Date,
    filters?: { teacherId?: string; roomId?: string; studentId?: string },
  ) {
    const courseFilter: any = {};
    if (filters?.teacherId) courseFilter.teacherId = filters.teacherId;
    if (filters?.roomId) courseFilter.roomId = filters.roomId;
    if (filters?.studentId) {
      courseFilter.enrollments = { some: { studentId: filters.studentId, status: 'ACTIVE' } };
    }

    const sessions = await this.prisma.courseSession.findMany({
      where: {
        startTime: { gte: startDate, lte: endDate },
        ...(Object.keys(courseFilter).length > 0 ? { course: courseFilter } : {}),
      },
      include: {
        course: {
          include: {
            teacher: { include: { user: { include: { profile: true } } } },
            room: true,
            instrument: true,
            enrollments: {
              where: { status: 'ACTIVE' },
              include: {
                student: { include: { user: { include: { profile: true } } } },
              },
            },
          },
        },
        attendance: {
          include: {
            student: { include: { user: { include: { profile: true } } } },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return sessions;
  }

  async getSession(id: string) {
    const session = await this.prisma.courseSession.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            teacher: { include: { user: { include: { profile: true } } } },
            room: true,
            instrument: true,
            enrollments: {
              where: { status: 'ACTIVE' },
              include: {
                student: { include: { user: { include: { profile: true } } } },
              },
            },
          },
        },
        attendance: {
          include: {
            student: { include: { user: { include: { profile: true } } } },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Session with id ${id} not found`);
    }

    return session;
  }

  async updateSession(id: string, dto: UpdateSessionDto) {
    await this.getSession(id);

    const updateData: any = {};

    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.isCancelled !== undefined) updateData.isCancelled = dto.isCancelled;
    if (dto.cancelReason !== undefined) updateData.cancelReason = dto.cancelReason;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.startTime !== undefined) updateData.startTime = dto.startTime;
    if (dto.endTime !== undefined) updateData.endTime = dto.endTime;

    // If rescheduled, update status
    if ((dto.startTime || dto.endTime) && dto.status === undefined) {
      updateData.status = 'RESCHEDULED';
    }

    // If cancelled, auto-set isCancelled
    if (dto.status === 'CANCELLED' && dto.isCancelled === undefined) {
      updateData.isCancelled = true;
    }

    const session = await this.prisma.courseSession.update({
      where: { id },
      data: updateData,
      include: {
        course: {
          include: {
            teacher: { include: { user: { include: { profile: true } } } },
            room: true,
          },
        },
      },
    });

    if (session.isCancelled) {
      this.eventEmitter.emit('session.cancelled', session);
    } else if (updateData.status === 'RESCHEDULED') {
      this.eventEmitter.emit('session.rescheduled', session);
    }

    this.logger.log(`Session ${id} updated: ${JSON.stringify(updateData)}`);
    return session;
  }

  async checkConflicts(params: {
    teacherId?: string;
    roomId?: string;
    startDate: Date;
    endDate: Date;
    excludeSessionId?: string;
  }) {
    const conflicts: any = {
      teacherConflicts: [],
      roomConflicts: [],
    };

    if (params.teacherId) {
      const teacherSessions = await this.prisma.courseSession.findMany({
        where: {
          id: params.excludeSessionId ? { not: params.excludeSessionId } : undefined,
          isCancelled: false,
          course: { teacherId: params.teacherId },
          OR: [
            {
              startTime: { lt: params.endDate },
              endTime: { gt: params.startDate },
            },
          ],
        },
        include: {
          course: {
            include: {
              teacher: { include: { user: { include: { profile: true } } } },
              room: true,
            },
          },
        },
      });
      conflicts.teacherConflicts = teacherSessions;
    }

    if (params.roomId) {
      const roomSessions = await this.prisma.courseSession.findMany({
        where: {
          id: params.excludeSessionId ? { not: params.excludeSessionId } : undefined,
          isCancelled: false,
          course: { roomId: params.roomId },
          OR: [
            {
              startTime: { lt: params.endDate },
              endTime: { gt: params.startDate },
            },
          ],
        },
        include: {
          course: {
            include: {
              room: true,
              teacher: { include: { user: { include: { profile: true } } } },
            },
          },
        },
      });
      conflicts.roomConflicts = roomSessions;
    }

    conflicts.hasConflicts =
      conflicts.teacherConflicts.length > 0 || conflicts.roomConflicts.length > 0;

    return conflicts;
  }
}

import { Prisma } from '@prisma/client';
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateAttendanceDto, BulkUpdateAttendanceDto } from './dto/attendance.dto';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getSessionAttendance(sessionId: string) {
    const session = await this.prisma.courseSession.findUnique({
      where: { id: sessionId },
      include: {
        course: {
          include: {
            enrollments: {
              where: { status: 'ACTIVE' },
              include: {
                student: { include: { user: { include: { profile: true } } } },
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Session with id ${sessionId} not found`);
    }

    const attendance = await this.prisma.attendance.findMany({
      where: { sessionId },
      include: {
        student: { include: { user: { include: { profile: true } } } },
      },
    });

    // Get all enrolled students and their attendance status
    const enrolledStudents = session.course.enrollments.map((e) => e.student);
    const attendanceMap = new Map(attendance.map((a) => [a.studentId, a]));

    const result = enrolledStudents.map((student) => ({
      student,
      attendance: attendanceMap.get(student.id) || null,
    }));

    return {
      session,
      attendance: result,
      summary: {
        total: enrolledStudents.length,
        present: attendance.filter((a) => a.status === 'PRESENT').length,
        absent: attendance.filter((a) => a.status === 'ABSENT').length,
        late: attendance.filter((a) => a.status === 'LATE').length,
        excused: attendance.filter((a) => a.status === 'EXCUSED').length,
        makeup: attendance.filter((a) => a.status === 'MAKEUP').length,
        unmarked: enrolledStudents.length - attendance.length,
      },
    };
  }

  async bulkUpdateAttendance(sessionId: string, dto: BulkUpdateAttendanceDto, markedById: string) {
    const session = await this.prisma.courseSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Session with id ${sessionId} not found`);
    }

    const results = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updates = await Promise.all(
        dto.attendance.map(async (item) => {
          return tx.attendance.upsert({
            where: {
              sessionId_studentId: {
                sessionId,
                studentId: item.studentId,
              },
            },
            update: {
              status: item.status,
              notes: item.notes,
              markedAt: new Date(),
              markedById,
            },
            create: {
              sessionId,
              studentId: item.studentId,
              status: item.status,
              notes: item.notes,
              markedAt: new Date(),
              markedById,
            },
            include: {
              student: { include: { user: { include: { profile: true } } } },
            },
          });
        }),
      );
      return updates;
    });

    // Update session status to IN_PROGRESS or COMPLETED
    await this.prisma.courseSession.update({
      where: { id: sessionId },
      data: {
        status: session.endTime < new Date() ? 'COMPLETED' : 'IN_PROGRESS',
      },
    });

    this.eventEmitter.emit('attendance.bulk.marked', {
      sessionId,
      count: results.length,
      markedById,
    });

    results.forEach((attendance: Prisma.AttendanceGetPayload<object>) => {
      this.eventEmitter.emit('attendance.marked', attendance);
    });

    this.logger.log(`Bulk attendance updated for session ${sessionId}: ${results.length} records`);
    return results;
  }

  async updateAttendance(id: string, dto: UpdateAttendanceDto) {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
      include: {
        student: { include: { user: { include: { profile: true } } } },
        session: { include: { course: true } },
      },
    });

    if (!attendance) {
      throw new NotFoundException(`Attendance record with id ${id} not found`);
    }

    const updated = await this.prisma.attendance.update({
      where: { id },
      data: {
        ...(dto.status && { status: dto.status }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        markedAt: new Date(),
      },
      include: {
        student: { include: { user: { include: { profile: true } } } },
        session: { include: { course: true } },
      },
    });

    this.eventEmitter.emit('attendance.updated', updated);
    return updated;
  }

  async getStudentAttendance(studentId: string, startDate?: Date, endDate?: Date) {
    const where: any = { studentId };

    if (startDate || endDate) {
      where.session = {};
      if (startDate) {
        where.session.startTime = { gte: startDate };
      }
      if (endDate) {
        where.session.startTime = {
          ...(where.session.startTime || {}),
          lte: endDate,
        };
      }
    }

    const records = await this.prisma.attendance.findMany({
      where,
      include: {
        session: {
          include: {
            course: {
              include: {
                teacher: { include: { user: { include: { profile: true } } } },
                instrument: true,
                room: true,
              },
            },
          },
        },
      },
      orderBy: { markedAt: 'desc' },
    });

    const total = records.length;
    const summary = {
      total,
      present: records.filter((r) => r.status === 'PRESENT').length,
      absent: records.filter((r) => r.status === 'ABSENT').length,
      late: records.filter((r) => r.status === 'LATE').length,
      excused: records.filter((r) => r.status === 'EXCUSED').length,
      makeup: records.filter((r) => r.status === 'MAKEUP').length,
      attendanceRate: total > 0
        ? Math.round(
            (records.filter((r) => ['PRESENT', 'LATE', 'MAKEUP'].includes(r.status)).length /
              total) *
              100,
          )
        : 0,
    };

    return { records, summary };
  }

  async getCourseAttendanceStats(courseId: string) {
    const sessions = await this.prisma.courseSession.findMany({
      where: { courseId, status: 'COMPLETED' },
      include: {
        attendance: true,
      },
      orderBy: { startTime: 'asc' },
    });

    const totalSessions = sessions.length;
    const allAttendance = sessions.flatMap((s) => s.attendance);

    const stats = {
      totalSessions,
      totalAttendanceRecords: allAttendance.length,
      byStatus: {
        PRESENT: allAttendance.filter((a) => a.status === 'PRESENT').length,
        ABSENT: allAttendance.filter((a) => a.status === 'ABSENT').length,
        LATE: allAttendance.filter((a) => a.status === 'LATE').length,
        EXCUSED: allAttendance.filter((a) => a.status === 'EXCUSED').length,
        MAKEUP: allAttendance.filter((a) => a.status === 'MAKEUP').length,
      },
      overallAttendanceRate:
        allAttendance.length > 0
          ? Math.round(
              (allAttendance.filter((a) => ['PRESENT', 'LATE', 'MAKEUP'].includes(a.status))
                .length /
                allAttendance.length) *
                100,
            )
          : 0,
      sessionBreakdown: sessions.map((s) => ({
        sessionId: s.id,
        startTime: s.startTime,
        total: s.attendance.length,
        present: s.attendance.filter((a) => a.status === 'PRESENT').length,
        absent: s.attendance.filter((a) => a.status === 'ABSENT').length,
        late: s.attendance.filter((a) => a.status === 'LATE').length,
      })),
    };

    return stats;
  }
}

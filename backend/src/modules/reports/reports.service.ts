import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const [
      activeStudents,
      activeTeachers,
      overdueInvoices,
      todaySessions,
      recentEnrollments,
      monthPayments,
    ] = await Promise.all([
      this.prisma.student.count({
        where: { enrollments: { some: { status: 'ACTIVE' } } },
      }),
      this.prisma.teacher.count({ where: { user: { isActive: true } } }),
      this.prisma.invoice.count({ where: { status: 'OVERDUE' } }),
      this.prisma.courseSession.findMany({
        where: { startTime: { gte: today, lte: todayEnd }, isCancelled: false },
        include: {
          course: { select: { name: true, type: true, room: { select: { name: true } } } },
        },
        orderBy: { startTime: 'asc' },
        take: 10,
      }),
      this.prisma.enrollment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          student: { include: { user: { include: { profile: true } } } },
          course: { select: { name: true, type: true } },
        },
      }),
      this.prisma.payment.findMany({
        where: { paidAt: { gte: monthStart, lte: monthEnd } },
        select: { amount: true },
      }),
    ]);

    const revenueThisMonth = monthPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      activeStudents,
      activeTeachers,
      revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
      overdueInvoices,
      todaySessions,
      recentEnrollments,
    };
  }

  async getAttendanceReport(
    courseId: string,
    startDate: Date,
    endDate: Date,
    format: 'json' | 'csv' = 'json',
  ) {
    const sessions = await this.prisma.courseSession.findMany({
      where: {
        courseId,
        startTime: { gte: startDate, lte: endDate },
      },
      include: {
        course: {
          include: {
            teacher: { include: { user: { include: { profile: true } } } },
            instrument: true,
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

    const reportData = sessions.map((session) => ({
      sessionId: session.id,
      date: session.startTime,
      courseName: session.course.name,
      teacherName: session.course.teacher?.user.profile
        ? `${session.course.teacher.user.profile.firstName} ${session.course.teacher.user.profile.lastName}`
        : 'N/A',
      status: session.status,
      attendance: session.attendance.map((a) => ({
        studentName: a.student.user.profile
          ? `${a.student.user.profile.firstName} ${a.student.user.profile.lastName}`
          : 'N/A',
        studentId: a.studentId,
        status: a.status,
        notes: a.notes,
        markedAt: a.markedAt,
      })),
      summary: {
        total: session.attendance.length,
        present: session.attendance.filter((a) => a.status === 'PRESENT').length,
        absent: session.attendance.filter((a) => a.status === 'ABSENT').length,
        late: session.attendance.filter((a) => a.status === 'LATE').length,
        excused: session.attendance.filter((a) => a.status === 'EXCUSED').length,
      },
    }));

    if (format === 'csv') {
      return this.convertAttendanceToCsv(reportData);
    }

    return reportData;
  }

  async getRevenueReport(startDate: Date, endDate: Date) {
    const payments = await this.prisma.payment.findMany({
      where: { paidAt: { gte: startDate, lte: endDate } },
      include: {
        invoice: {
          include: {
            items: {
              include: {
                student: {
                  include: {
                    enrollments: {
                      include: { course: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Monthly breakdown
    const monthlyBreakdown = new Map<string, number>();
    for (const payment of payments) {
      const month = payment.paidAt.toISOString().substring(0, 7);
      monthlyBreakdown.set(month, (monthlyBreakdown.get(month) || 0) + Number(payment.amount));
    }

    // Revenue by payment method
    const byMethod = new Map<string, number>();
    for (const payment of payments) {
      byMethod.set(payment.method, (byMethod.get(payment.method) || 0) + Number(payment.amount));
    }

    // Outstanding invoices
    const outstanding = await this.prisma.invoice.findMany({
      where: {
        status: { in: ['SENT', 'PARTIAL', 'OVERDUE'] },
        periodStart: { gte: startDate },
        periodEnd: { lte: endDate },
      },
      select: { total: true, status: true },
    });

    const totalOutstanding = outstanding.reduce((sum, i) => sum + Number(i.total), 0);

    return {
      period: { startDate, endDate },
      totalRevenue,
      totalOutstanding,
      collectionRate:
        totalRevenue + totalOutstanding > 0
          ? Math.round((totalRevenue / (totalRevenue + totalOutstanding)) * 100)
          : 0,
      monthlyBreakdown: Object.fromEntries(monthlyBreakdown),
      byPaymentMethod: Object.fromEntries(byMethod),
      transactionCount: payments.length,
    };
  }

  async getStudentsReport() {
    const [totalStudents, activeEnrollments, instruments] = await Promise.all([
      this.prisma.student.count(),
      this.prisma.enrollment.groupBy({
        by: ['courseId'],
        where: { status: 'ACTIVE' },
        _count: { studentId: true },
      }),
      this.prisma.instrument.findMany({
        include: {
          students: {
            select: { studentId: true, level: true },
          },
          _count: { select: { students: true } },
        },
      }),
    ]);

    const activeCourses = await this.prisma.course.findMany({
      where: { isActive: true },
      include: {
        enrollments: { where: { status: 'ACTIVE' }, select: { studentId: true } },
        instrument: true,
        teacher: { include: { user: { include: { profile: true } } } },
      },
    });

    const instrumentStats = instruments.map((inst) => ({
      name: inst.name,
      category: inst.category,
      totalStudents: inst._count.students,
      byLevel: {
        BEGINNER: inst.students.filter((s) => s.level === 'BEGINNER').length,
        INTERMEDIATE: inst.students.filter((s) => s.level === 'INTERMEDIATE').length,
        ADVANCED: inst.students.filter((s) => s.level === 'ADVANCED').length,
      },
    }));

    const courseStats = activeCourses.map((course) => ({
      courseId: course.id,
      courseName: course.name,
      type: course.type,
      instrument: course.instrument?.name,
      teacher: course.teacher?.user.profile
        ? `${course.teacher.user.profile.firstName} ${course.teacher.user.profile.lastName}`
        : 'N/A',
      activeStudents: course.enrollments.length,
      maxStudents: course.maxStudents,
      occupancyRate: Math.round((course.enrollments.length / course.maxStudents) * 100),
    }));

    return {
      totalStudents,
      totalActiveCourses: activeCourses.length,
      totalActiveEnrollments: activeEnrollments.reduce((sum, e) => sum + e._count.studentId, 0),
      instrumentStats: instrumentStats.sort((a, b) => b.totalStudents - a.totalStudents),
      courseStats: courseStats.sort((a, b) => b.activeStudents - a.activeStudents),
    };
  }

  async getTeacherHoursReport(teacherId: string, startDate: Date, endDate: Date) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: { user: { include: { profile: true } } },
    });

    if (!teacher) {
      throw new Error(`Teacher with id ${teacherId} not found`);
    }

    const sessions = await this.prisma.courseSession.findMany({
      where: {
        course: { teacherId },
        startTime: { gte: startDate, lte: endDate },
        status: { in: ['COMPLETED', 'IN_PROGRESS'] },
        isCancelled: false,
      },
      include: {
        course: { include: { instrument: true } },
        attendance: true,
      },
      orderBy: { startTime: 'asc' },
    });

    const totalMinutes = sessions.reduce((sum, s) => {
      const duration = (s.endTime.getTime() - s.startTime.getTime()) / (1000 * 60);
      return sum + duration;
    }, 0);

    const totalHours = totalMinutes / 60;

    const earnings = teacher.hourlyRate
      ? totalHours * Number(teacher.hourlyRate)
      : null;

    // Group by course type
    const byCourseType = new Map<string, { sessions: number; hours: number }>();
    for (const session of sessions) {
      const type = session.course.type;
      const duration = (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60 * 60);
      const existing = byCourseType.get(type) || { sessions: 0, hours: 0 };
      byCourseType.set(type, {
        sessions: existing.sessions + 1,
        hours: existing.hours + duration,
      });
    }

    // Weekly breakdown
    const weeklyBreakdown = new Map<string, number>();
    for (const session of sessions) {
      const weekStart = this.getWeekStart(session.startTime);
      const duration = (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60 * 60);
      weeklyBreakdown.set(weekStart, (weeklyBreakdown.get(weekStart) || 0) + duration);
    }

    return {
      teacher: {
        id: teacher.id,
        name: teacher.user.profile
          ? `${teacher.user.profile.firstName} ${teacher.user.profile.lastName}`
          : teacher.user.email,
        hourlyRate: teacher.hourlyRate,
      },
      period: { startDate, endDate },
      totalSessions: sessions.length,
      totalHours: Math.round(totalHours * 100) / 100,
      estimatedEarnings: earnings ? Math.round(earnings * 100) / 100 : null,
      byCourseType: Object.fromEntries(byCourseType),
      weeklyBreakdown: Object.fromEntries(weeklyBreakdown),
      sessions: sessions.map((s) => ({
        id: s.id,
        date: s.startTime,
        course: s.course.name,
        type: s.course.type,
        instrument: s.course.instrument?.name,
        durationMinutes: (s.endTime.getTime() - s.startTime.getTime()) / (1000 * 60),
        studentsPresent: s.attendance.filter((a) => a.status === 'PRESENT').length,
        totalStudents: s.attendance.length,
      })),
    };
  }

  private convertAttendanceToCsv(data: any[]): string {
    const rows: string[] = [];
    rows.push('Session Date,Course,Teacher,Student,Attendance Status,Notes');

    for (const session of data) {
      for (const record of session.attendance) {
        rows.push(
          [
            new Date(session.date).toISOString().split('T')[0],
            `"${session.courseName}"`,
            `"${session.teacherName}"`,
            `"${record.studentName}"`,
            record.status,
            `"${record.notes || ''}"`,
          ].join(','),
        );
      }
    }

    return rows.join('\n');
  }

  private getWeekStart(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  }
}

import { Prisma } from '@prisma/client';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { getPaginationParams, paginatedResponse } from '../../common/utils/pagination.util';
import {
  CreateCourseDto,
  UpdateCourseDto,
  GenerateSessionsDto,
  EnrollStudentDto,
} from './dto/course.dto';
import { generateSessionDates } from '../../common/utils/rrule.util';

@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(pagination: PaginationDto, filters?: { type?: string; teacherId?: string; isActive?: boolean }) {
    const { skip, take } = getPaginationParams(pagination);

    const where: any = {};

    if (pagination.search) {
      where.OR = [
        { name: { contains: pagination.search, mode: 'insensitive' } },
        { description: { contains: pagination.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.type) where.type = filters.type;
    if (filters?.teacherId) where.teacherId = filters.teacherId;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take,
        include: {
          teacher: { include: { user: { include: { profile: true } } } },
          room: true,
          instrument: true,
          _count: { select: { enrollments: true, sessions: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.course.count({ where }),
    ]);

    return paginatedResponse(courses, total, pagination.page || 1, take);
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
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
        _count: { select: { sessions: true } },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with id ${id} not found`);
    }

    return course;
  }

  async create(dto: CreateCourseDto) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id: dto.teacherId } });
    if (!teacher) throw new NotFoundException(`Teacher with id ${dto.teacherId} not found`);

    const room = await this.prisma.room.findUnique({ where: { id: dto.roomId } });
    if (!room) throw new NotFoundException(`Room with id ${dto.roomId} not found`);

    if (dto.instrumentId) {
      const instrument = await this.prisma.instrument.findUnique({ where: { id: dto.instrumentId } });
      if (!instrument) throw new NotFoundException(`Instrument with id ${dto.instrumentId} not found`);
    }

    const course = await this.prisma.course.create({
      data: {
        name: dto.name,
        type: dto.type,
        description: dto.description,
        teacherId: dto.teacherId,
        roomId: dto.roomId,
        instrumentId: dto.instrumentId,
        maxStudents: dto.maxStudents ?? 1,
        durationMinutes: dto.durationMinutes ?? 60,
        color: dto.color || '#8B5CF6',
        recurrenceRule: dto.recurrenceRule,
        pricePerSession: dto.pricePerSession,
        priceMonthly: dto.priceMonthly,
        priceYearly: dto.priceYearly,
      },
      include: {
        teacher: { include: { user: { include: { profile: true } } } },
        room: true,
        instrument: true,
      },
    });

    this.logger.log(`Course created: ${course.name}`);
    this.eventEmitter.emit('course.created', course);
    return course;
  }

  async update(id: string, dto: UpdateCourseDto) {
    await this.findOne(id);

    return this.prisma.course.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.pricePerSession !== undefined ? { pricePerSession: dto.pricePerSession } : {}),
        ...(dto.priceMonthly !== undefined ? { priceMonthly: dto.priceMonthly } : {}),
        ...(dto.priceYearly !== undefined ? { priceYearly: dto.priceYearly } : {}),
      },
      include: {
        teacher: { include: { user: { include: { profile: true } } } },
        room: true,
        instrument: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.course.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async generateSessions(courseId: string, dto: GenerateSessionsDto) {
    const course = await this.findOne(courseId);

    if (!course.recurrenceRule) {
      throw new BadRequestException('Course does not have a recurrence rule defined');
    }

    // Get vacations if needed
    let vacations: { startDate: Date; endDate: Date }[] = [];
    if (!dto.skipVacationCheck) {
      const dbVacations = await this.prisma.vacation.findMany({
        where: {
          affectsCourses: true,
          OR: [
            {
              startDate: { lte: new Date(dto.endDate) },
              endDate: { gte: new Date(dto.startDate) },
            },
          ],
        },
      });
      vacations = dbVacations.map((v) => ({
        startDate: v.startDate,
        endDate: v.endDate,
      }));
    }

    const sessionDates = generateSessionDates(
      course.recurrenceRule,
      new Date(dto.startDate),
      new Date(dto.endDate),
      course.durationMinutes,
      vacations,
    );

    if (sessionDates.length === 0) {
      return { created: 0, sessions: [] };
    }

    // Filter out sessions that already exist
    const existingSessions = await this.prisma.courseSession.findMany({
      where: {
        courseId,
        startTime: {
          gte: new Date(dto.startDate),
          lte: new Date(dto.endDate),
        },
      },
      select: { startTime: true },
    });

    const existingTimes = new Set(existingSessions.map((s) => s.startTime.toISOString()));

    const newSessions = sessionDates.filter(
      (s) => !existingTimes.has(s.startTime.toISOString()),
    );

    if (newSessions.length === 0) {
      return { created: 0, sessions: [] };
    }

    const created = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const sessions = await Promise.all(
        newSessions.map((s) =>
          tx.courseSession.create({
            data: {
              courseId,
              startTime: s.startTime,
              endTime: s.endTime,
              status: 'SCHEDULED',
            },
          }),
        ),
      );
      return sessions;
    });

    this.logger.log(`Generated ${created.length} sessions for course ${courseId}`);
    this.eventEmitter.emit('sessions.generated', { courseId, count: created.length });

    return { created: created.length, sessions: created };
  }

  async getSessions(courseId: string, pagination: PaginationDto) {
    await this.findOne(courseId);

    const { skip, take } = getPaginationParams(pagination);

    const [sessions, total] = await Promise.all([
      this.prisma.courseSession.findMany({
        where: { courseId },
        skip,
        take,
        include: {
          attendance: {
            include: {
              student: { include: { user: { include: { profile: true } } } },
            },
          },
        },
        orderBy: { startTime: 'asc' },
      }),
      this.prisma.courseSession.count({ where: { courseId } }),
    ]);

    return paginatedResponse(sessions, total, pagination.page || 1, take);
  }

  async getEnrollments(courseId: string) {
    await this.findOne(courseId);

    return this.prisma.enrollment.findMany({
      where: { courseId },
      include: {
        student: { include: { user: { include: { profile: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async enrollStudent(courseId: string, dto: EnrollStudentDto) {
    const course = await this.findOne(courseId);

    const student = await this.prisma.student.findUnique({ where: { id: dto.studentId } });
    if (!student) throw new NotFoundException(`Student with id ${dto.studentId} not found`);

    // Check max students
    const activeEnrollments = await this.prisma.enrollment.count({
      where: { courseId, status: 'ACTIVE' },
    });

    if (activeEnrollments >= course.maxStudents) {
      throw new BadRequestException(`Course is full (max ${course.maxStudents} students)`);
    }

    const existing = await this.prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId: dto.studentId, courseId },
      },
    });

    if (existing) {
      if (existing.status === 'ACTIVE') {
        throw new ConflictException('Student is already enrolled in this course');
      }

      // Re-enroll if previously unenrolled
      return this.prisma.enrollment.update({
        where: { id: existing.id },
        data: {
          status: 'ACTIVE',
          startDate: dto.startDate || new Date(),
          paymentType: dto.paymentType || 'PER_SESSION',
          notes: dto.notes,
        },
        include: {
          student: { include: { user: { include: { profile: true } } } },
          course: true,
        },
      });
    }

    const enrollment = await this.prisma.enrollment.create({
      data: {
        studentId: dto.studentId,
        courseId,
        startDate: dto.startDate || new Date(),
        paymentType: dto.paymentType || 'PER_SESSION',
        notes: dto.notes,
        status: 'ACTIVE',
      },
      include: {
        student: { include: { user: { include: { profile: true } } } },
        course: true,
      },
    });

    this.eventEmitter.emit('enrollment.created', enrollment);
    this.logger.log(`Student ${dto.studentId} enrolled in course ${courseId}`);
    return enrollment;
  }

  async unenrollStudent(courseId: string, studentId: string) {
    await this.findOne(courseId);

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    const updated = await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { status: 'CANCELLED', endDate: new Date() },
    });

    this.eventEmitter.emit('enrollment.cancelled', updated);
    return updated;
  }
}

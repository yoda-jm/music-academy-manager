import { Prisma } from '@prisma/client';
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { getPaginationParams, paginatedResponse } from '../../common/utils/pagination.util';
import {
  CreateTeacherDto,
  UpdateTeacherDto,
  SetTeacherAvailabilityDto,
  SetTeacherInstrumentsDto,
} from './dto/teacher.dto';

@Injectable()
export class TeachersService {
  private readonly logger = new Logger(TeachersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(pagination: PaginationDto) {
    const { skip, take } = getPaginationParams(pagination);

    const where: any = {};
    if (pagination.search) {
      where.OR = [
        { user: { email: { contains: pagination.search, mode: 'insensitive' } } },
        { user: { profile: { firstName: { contains: pagination.search, mode: 'insensitive' } } } },
        { user: { profile: { lastName: { contains: pagination.search, mode: 'insensitive' } } } },
      ];
    }

    const [teachers, total] = await Promise.all([
      this.prisma.teacher.findMany({
        where,
        skip,
        take,
        include: {
          user: { include: { profile: true } },
          specializations: { include: { instrument: true } },
          availability: true,
          _count: { select: { courses: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.teacher.count({ where }),
    ]);

    return paginatedResponse(teachers, total, pagination.page || 1, take);
  }

  async findOne(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: {
        user: { include: { profile: true } },
        specializations: { include: { instrument: true } },
        availability: { orderBy: { dayOfWeek: 'asc' } },
        courses: {
          where: { isActive: true },
          include: { room: true, instrument: true },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with id ${id} not found`);
    }

    return teacher;
  }

  async create(dto: CreateTeacherDto) {
    // Determine if we're creating a new user or linking to existing
    const isNewUser = !dto.userId && dto.email && dto.password;

    if (!isNewUser && !dto.userId) {
      throw new BadRequestException(
        'Provide either userId (existing user) or email+password+firstName+lastName (new user)',
      );
    }

    if (isNewUser) {
      // Validate required fields for new user
      if (!dto.firstName || !dto.lastName) {
        throw new BadRequestException('firstName and lastName are required when creating a new user');
      }

      // Check email is not already taken
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email!.toLowerCase() },
      });
      if (existing) {
        throw new ConflictException('Email already registered');
      }

      const passwordHash = await bcrypt.hash(dto.password!, 12);

      return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const user = await tx.user.create({
          data: {
            email: dto.email!.toLowerCase(),
            passwordHash,
            role: 'TEACHER',
            isActive: true,
            profile: {
              create: {
                firstName: dto.firstName!,
                lastName: dto.lastName!,
                phone: dto.phone,
              },
            },
          },
        });

        const teacher = await tx.teacher.create({
          data: {
            userId: user.id,
            bio: dto.bio,
            hourlyRate: dto.hourlyRate,
          },
          include: {
            user: { include: { profile: true } },
            specializations: { include: { instrument: true } },
            availability: true,
          },
        });

        this.logger.log(`Teacher created with new user account: ${user.email}`);
        return teacher;
      });
    }

    // Existing user path
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId! } });
    if (!user) {
      throw new NotFoundException(`User with id ${dto.userId} not found`);
    }

    const existing = await this.prisma.teacher.findUnique({ where: { userId: dto.userId! } });
    if (existing) {
      throw new ConflictException('Teacher profile already exists for this user');
    }

    const teacher = await this.prisma.teacher.create({
      data: {
        userId: dto.userId!,
        bio: dto.bio,
        hourlyRate: dto.hourlyRate,
      },
      include: {
        user: { include: { profile: true } },
        specializations: { include: { instrument: true } },
        availability: true,
      },
    });

    // Update user role to TEACHER if not already admin
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      await this.prisma.user.update({
        where: { id: dto.userId! },
        data: { role: 'TEACHER' },
      });
    }

    this.logger.log(`Teacher profile created for user: ${dto.userId}`);
    return teacher;
  }

  async update(id: string, dto: UpdateTeacherDto) {
    const teacher = await this.findOne(id);

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update profile fields if provided
      const profileUpdates: any = {};
      if (dto.firstName !== undefined) profileUpdates.firstName = dto.firstName;
      if (dto.lastName !== undefined) profileUpdates.lastName = dto.lastName;
      if (dto.phone !== undefined) profileUpdates.phone = dto.phone;

      if (Object.keys(profileUpdates).length > 0) {
        await tx.profile.updateMany({
          where: { userId: teacher.userId },
          data: profileUpdates,
        });
      }

      // Update user isActive if provided
      if (dto.isActive !== undefined) {
        await tx.user.update({
          where: { id: teacher.userId },
          data: { isActive: dto.isActive },
        });
      }

      // Update teacher fields
      const teacherUpdates: any = {};
      if (dto.bio !== undefined) teacherUpdates.bio = dto.bio;
      if (dto.hourlyRate !== undefined) teacherUpdates.hourlyRate = dto.hourlyRate;

      if (Object.keys(teacherUpdates).length > 0) {
        await tx.teacher.update({ where: { id }, data: teacherUpdates });
      }
    });

    return this.findOne(id);
  }

  async remove(id: string) {
    const teacher = await this.findOne(id);
    const courseCount = await this.prisma.course.count({ where: { teacherId: id } });
    if (courseCount > 0) {
      throw new ConflictException(
        `Cannot delete teacher: they are assigned to ${courseCount} course(s). Deactivate them instead.`,
      );
    }
    await this.prisma.user.delete({ where: { id: teacher.userId } });
    return { ok: true };
  }

  async getAvailability(teacherId: string) {
    await this.findOne(teacherId);

    return this.prisma.teacherAvailability.findMany({
      where: { teacherId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async setAvailability(teacherId: string, dto: SetTeacherAvailabilityDto) {
    await this.findOne(teacherId);

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.teacherAvailability.deleteMany({ where: { teacherId } });

      if (dto.availability.length > 0) {
        await tx.teacherAvailability.createMany({
          data: dto.availability.map((a) => ({
            teacherId,
            dayOfWeek: a.dayOfWeek,
            startTime: a.startTime,
            endTime: a.endTime,
            isRecurring: a.isRecurring ?? true,
          })),
        });
      }
    });

    return this.getAvailability(teacherId);
  }

  async getSchedule(teacherId: string, startDate?: Date, endDate?: Date) {
    await this.findOne(teacherId);

    const now = new Date();
    const start = startDate || now;
    const end = endDate || new Date(now.setDate(now.getDate() + 30));

    return this.prisma.courseSession.findMany({
      where: {
        course: { teacherId },
        startTime: { gte: start, lte: end },
        isCancelled: false,
      },
      include: {
        course: {
          include: {
            room: true,
            instrument: true,
            enrollments: {
              where: { status: 'ACTIVE' },
              include: { student: { include: { user: { include: { profile: true } } } } },
            },
          },
        },
        attendance: {
          include: { student: { include: { user: { include: { profile: true } } } } },
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async getInstruments(teacherId: string) {
    await this.findOne(teacherId);
    return this.prisma.teacherInstrument.findMany({
      where: { teacherId },
      include: { instrument: true },
    });
  }

  async setInstruments(teacherId: string, dto: SetTeacherInstrumentsDto) {
    await this.findOne(teacherId);

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.teacherInstrument.deleteMany({ where: { teacherId } });

      if (dto.instruments.length > 0) {
        await tx.teacherInstrument.createMany({
          data: dto.instruments.map((i) => ({
            teacherId,
            instrumentId: i.instrumentId,
            level: i.level || 'INTERMEDIATE',
          })),
        });
      }
    });

    return this.prisma.teacherInstrument.findMany({
      where: { teacherId },
      include: { instrument: true },
    });
  }
}

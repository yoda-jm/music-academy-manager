import { Prisma } from '@prisma/client';
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { getPaginationParams, paginatedResponse } from '../../common/utils/pagination.util';
import { CreateStudentDto, UpdateStudentDto, SetStudentInstrumentsDto } from './dto/student.dto';
import { Role } from '@prisma/client';

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

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

    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip,
        take,
        include: {
          user: { include: { profile: true } },
          family: true,
          instruments: { include: { instrument: true } },
          _count: { select: { enrollments: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.student.count({ where }),
    ]);

    return paginatedResponse(students, total, pagination.page || 1, take);
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        user: { include: { profile: true } },
        family: { include: { members: { include: { user: { include: { profile: true } } } } } },
        instruments: { include: { instrument: true } },
        enrollments: {
          include: {
            course: {
              include: {
                teacher: { include: { user: { include: { profile: true } } } },
                room: true,
                instrument: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with id ${id} not found`);
    }

    return student;
  }

  async create(dto: CreateStudentDto) {
    const isNewUser = !dto.userId && dto.email && dto.password;

    if (!isNewUser && !dto.userId) {
      throw new BadRequestException(
        'Provide either userId (existing user) or email+password+firstName+lastName (new user)',
      );
    }

    if (dto.familyId) {
      const family = await this.prisma.family.findUnique({ where: { id: dto.familyId } });
      if (!family) {
        throw new NotFoundException(`Family with id ${dto.familyId} not found`);
      }
    }

    if (isNewUser) {
      if (!dto.firstName || !dto.lastName) {
        throw new BadRequestException('firstName and lastName are required when creating a new user');
      }

      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email!.toLowerCase() },
      });
      if (existing) {
        throw new ConflictException('Email already registered');
      }

      const passwordHash = await bcrypt.hash(dto.password!, 12);
      const birthDate = dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined;

      return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const user = await tx.user.create({
          data: {
            email: dto.email!.toLowerCase(),
            passwordHash,
            role: 'STUDENT',
            isActive: true,
            profile: {
              create: {
                firstName: dto.firstName!,
                lastName: dto.lastName!,
                phone: dto.phone,
                birthDate,
                notes: dto.notes,
              },
            },
          },
        });

        const student = await tx.student.create({
          data: {
            userId: user.id,
            familyId: dto.familyId,
          },
          include: {
            user: { include: { profile: true } },
            instruments: { include: { instrument: true } },
            family: true,
          },
        });

        this.logger.log(`Student created with new user account: ${user.email}`);
        return student;
      });
    }

    // Existing user path
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId! } });
    if (!user) {
      throw new NotFoundException(`User with id ${dto.userId} not found`);
    }

    const existing = await this.prisma.student.findUnique({ where: { userId: dto.userId! } });
    if (existing) {
      throw new ConflictException('Student profile already exists for this user');
    }

    const student = await this.prisma.student.create({
      data: {
        userId: dto.userId!,
        familyId: dto.familyId,
      },
      include: {
        user: { include: { profile: true } },
        instruments: { include: { instrument: true } },
        family: true,
      },
    });

    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      await this.prisma.user.update({
        where: { id: dto.userId! },
        data: { role: 'STUDENT' },
      });
    }

    this.logger.log(`Student profile created for user: ${dto.userId}`);
    return student;
  }

  async update(id: string, dto: UpdateStudentDto) {
    const student = await this.findOne(id);

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update profile fields if provided
      const profileUpdates: any = {};
      if (dto.firstName !== undefined) profileUpdates.firstName = dto.firstName;
      if (dto.lastName !== undefined) profileUpdates.lastName = dto.lastName;
      if (dto.phone !== undefined) profileUpdates.phone = dto.phone;
      if (dto.notes !== undefined) profileUpdates.notes = dto.notes;
      if (dto.dateOfBirth !== undefined) {
        profileUpdates.birthDate = dto.dateOfBirth ? new Date(dto.dateOfBirth) : null;
      }

      if (Object.keys(profileUpdates).length > 0) {
        await tx.profile.updateMany({
          where: { userId: student.userId },
          data: profileUpdates,
        });
      }

      // Update user isActive if provided
      if (dto.isActive !== undefined) {
        await tx.user.update({
          where: { id: student.userId },
          data: { isActive: dto.isActive },
        });
      }

      // Update student fields
      if (dto.familyId !== undefined) {
        if (dto.familyId) {
          const family = await tx.family.findUnique({ where: { id: dto.familyId } });
          if (!family) {
            throw new NotFoundException(`Family with id ${dto.familyId} not found`);
          }
        }
        await tx.student.update({
          where: { id },
          data: { familyId: dto.familyId || null },
        });
      }
    });

    return this.findOne(id);
  }

  async remove(id: string) {
    const student = await this.findOne(id);
    const [enrollmentCount, attendanceCount, eventCount] = await Promise.all([
      this.prisma.enrollment.count({ where: { studentId: id } }),
      this.prisma.attendance.count({ where: { studentId: id } }),
      this.prisma.eventParticipant.count({ where: { userId: student.userId } }),
    ]);
    if (enrollmentCount > 0 || attendanceCount > 0 || eventCount > 0) {
      throw new ConflictException(
        `Cannot delete student: they have historical records (${enrollmentCount} enrollment(s), ${attendanceCount} attendance record(s), ${eventCount} event participation(s)). Deactivate them instead.`,
      );
    }
    await this.prisma.user.delete({ where: { id: student.userId } });
    return { ok: true };
  }

  async getInstruments(studentId: string) {
    await this.findOne(studentId);

    return this.prisma.studentInstrument.findMany({
      where: { studentId },
      include: { instrument: true },
      orderBy: { startDate: 'desc' },
    });
  }

  async setInstruments(studentId: string, dto: SetStudentInstrumentsDto) {
    await this.findOne(studentId);

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.studentInstrument.deleteMany({ where: { studentId } });

      if (dto.instruments.length > 0) {
        await tx.studentInstrument.createMany({
          data: dto.instruments.map((i) => ({
            studentId,
            instrumentId: i.instrumentId,
            level: i.level || 'BEGINNER',
            startDate: i.startDate || new Date(),
            notes: i.notes,
          })),
        });
      }
    });

    return this.getInstruments(studentId);
  }

  async getEnrollments(studentId: string, currentUser: any) {
    const student = await this.findOne(studentId);

    if (currentUser.role === Role.STUDENT || currentUser.role === Role.PARENT) {
      if (student.userId !== currentUser.id) {
        throw new ForbiddenException('You can only view your own enrollments');
      }
    }

    return this.prisma.enrollment.findMany({
      where: { studentId },
      include: {
        course: {
          include: {
            teacher: { include: { user: { include: { profile: true } } } },
            room: true,
            instrument: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAttendance(studentId: string, startDate?: Date, endDate?: Date, currentUser?: any) {
    const student = await this.findOne(studentId);

    if (currentUser && (currentUser.role === Role.STUDENT || currentUser.role === Role.PARENT)) {
      if (student.userId !== currentUser.id) {
        throw new ForbiddenException('You can only view your own attendance');
      }
    }

    const where: any = { studentId };

    if (startDate || endDate) {
      where.session = {};
      if (startDate) where.session.startTime = { gte: startDate };
      if (endDate) {
        where.session.startTime = { ...where.session.startTime, lte: endDate };
      }
    }

    return this.prisma.attendance.findMany({
      where,
      include: {
        session: {
          include: {
            course: {
              include: {
                teacher: { include: { user: { include: { profile: true } } } },
                instrument: true,
              },
            },
          },
        },
      },
      orderBy: { markedAt: 'desc' },
    });
  }
}

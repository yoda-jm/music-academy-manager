import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { getPaginationParams, paginatedResponse } from '../../common/utils/pagination.util';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Role, User, Profile } from '@prisma/client';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(pagination: PaginationDto, rolesFilter?: Role[]) {
    const { skip, take } = getPaginationParams(pagination);

    const where: any = {};

    if (pagination.search) {
      where.OR = [
        { email: { contains: pagination.search, mode: 'insensitive' } },
        { profile: { firstName: { contains: pagination.search, mode: 'insensitive' } } },
        { profile: { lastName: { contains: pagination.search, mode: 'insensitive' } } },
      ];
    }

    if (rolesFilter && rolesFilter.length > 0) {
      where.role = { in: rolesFilter };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        include: { profile: true },
        orderBy: pagination.sortBy
          ? { [pagination.sortBy]: pagination.sortOrder }
          : { createdAt: pagination.sortOrder || 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    const sanitized = users.map((u: User & { profile: Profile | null }) => this.sanitizeUser(u));
    return paginatedResponse(sanitized, total, pagination.page || 1, take);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return this.sanitizeUser(user);
  }

  async update(id: string, dto: UpdateUserDto, requestingUser: any) {
    await this.findOne(id);

    const updateData: any = {};

    if (dto.role !== undefined) {
      if (
        requestingUser.role !== Role.SUPER_ADMIN &&
        requestingUser.role !== Role.ADMIN
      ) {
        throw new ForbiddenException('Only admins can change roles');
      }
      updateData.role = dto.role;
    }

    if (dto.isActive !== undefined) {
      if (
        requestingUser.role !== Role.SUPER_ADMIN &&
        requestingUser.role !== Role.ADMIN
      ) {
        throw new ForbiddenException('Only admins can change user status');
      }
      updateData.isActive = dto.isActive;
    }

    if (dto.password) {
      if (requestingUser.id !== id && requestingUser.role !== Role.SUPER_ADMIN) {
        throw new ForbiddenException('You can only change your own password');
      }
      updateData.passwordHash = await bcrypt.hash(dto.password, 12);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: { profile: true },
    });

    return this.sanitizeUser(user);
  }

  async remove(id: string) {
    await this.findOne(id);

    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    this.logger.log(`User ${id} soft deleted`);
    return this.sanitizeUser(user);
  }

  async getProfile(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: { user: { select: { email: true, role: true } } },
    });

    if (!profile) {
      throw new NotFoundException(`Profile for user ${userId} not found`);
    }

    return profile;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto, requestingUser: any) {
    if (
      requestingUser.id !== userId &&
      requestingUser.role !== Role.SUPER_ADMIN &&
      requestingUser.role !== Role.ADMIN
    ) {
      throw new ForbiddenException('You can only update your own profile');
    }

    const profile = await this.prisma.profile.upsert({
      where: { userId },
      update: { ...dto },
      create: {
        userId,
        firstName: dto.firstName || '',
        lastName: dto.lastName || '',
        ...dto,
      },
    });

    return profile;
  }

  sanitizeUser(user: any) {
    const { passwordHash, refreshToken, ...sanitized } = user;
    return sanitized;
  }
}

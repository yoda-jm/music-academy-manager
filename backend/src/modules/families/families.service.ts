import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { getPaginationParams, paginatedResponse } from '../../common/utils/pagination.util';
import { CreateFamilyDto, UpdateFamilyDto, AddFamilyMemberDto, UpdateFamilyMemberDto } from './dto/create-family.dto';
import { FamilyRelation } from '@prisma/client';

@Injectable()
export class FamiliesService {
  private readonly logger = new Logger(FamiliesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(pagination: PaginationDto) {
    const { skip, take } = getPaginationParams(pagination);

    const where: any = {};
    if (pagination.search) {
      where.name = { contains: pagination.search, mode: 'insensitive' };
    }

    const [families, total] = await Promise.all([
      this.prisma.family.findMany({
        where,
        skip,
        take,
        include: {
          members: {
            include: {
              user: { include: { profile: true } },
            },
          },
          students: {
            include: {
              user: { include: { profile: true } },
            },
          },
          _count: { select: { invoices: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.family.count({ where }),
    ]);

    return paginatedResponse(families, total, pagination.page || 1, take);
  }

  async findOne(id: string) {
    const family = await this.prisma.family.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { include: { profile: true } },
          },
        },
        students: {
          include: {
            user: { include: { profile: true } },
            instruments: { include: { instrument: true } },
            enrollments: {
              where: { status: 'ACTIVE' },
              include: { course: true },
            },
          },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!family) {
      throw new NotFoundException(`Family with id ${id} not found`);
    }

    return family;
  }

  async create(dto: CreateFamilyDto) {
    const family = await this.prisma.family.create({
      data: { name: dto.name },
      include: { members: true, students: true },
    });

    this.logger.log(`Family created: ${family.name}`);
    return family;
  }

  async update(id: string, dto: UpdateFamilyDto) {
    await this.findOne(id);

    return this.prisma.family.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.family.delete({ where: { id } });
  }

  async addMember(familyId: string, dto: AddFamilyMemberDto) {
    await this.findOne(familyId);

    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${dto.userId} not found`);
    }

    const existing = await this.prisma.familyMember.findUnique({
      where: {
        familyId_userId: {
          familyId,
          userId: dto.userId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('User is already a member of this family');
    }

    return this.prisma.familyMember.create({
      data: {
        familyId,
        userId: dto.userId,
        relation: (dto.relation as FamilyRelation) || FamilyRelation.OTHER,
        isPrimary: dto.isPrimary || false,
      },
      include: {
        user: { include: { profile: true } },
      },
    });
  }

  async updateMember(familyId: string, userId: string, dto: UpdateFamilyMemberDto) {
    await this.findOne(familyId);

    const member = await this.prisma.familyMember.findUnique({
      where: { familyId_userId: { familyId, userId } },
    });

    if (!member) {
      throw new NotFoundException('Family member not found');
    }

    return this.prisma.familyMember.update({
      where: { familyId_userId: { familyId, userId } },
      data: {
        ...(dto.relation && { relation: dto.relation as FamilyRelation }),
        ...(dto.isPrimary !== undefined && { isPrimary: dto.isPrimary }),
      },
      include: { user: { include: { profile: true } } },
    });
  }

  async removeMember(familyId: string, userId: string) {
    await this.findOne(familyId);

    const member = await this.prisma.familyMember.findUnique({
      where: {
        familyId_userId: { familyId, userId },
      },
    });

    if (!member) {
      throw new NotFoundException('Family member not found');
    }

    return this.prisma.familyMember.delete({
      where: {
        familyId_userId: { familyId, userId },
      },
    });
  }

  async getFamilyStudents(familyId: string) {
    await this.findOne(familyId);

    return this.prisma.student.findMany({
      where: { familyId },
      include: {
        user: { include: { profile: true } },
        instruments: { include: { instrument: true } },
        enrollments: {
          where: { status: 'ACTIVE' },
          include: { course: { include: { teacher: { include: { user: { include: { profile: true } } } } } } },
        },
      },
    });
  }
}

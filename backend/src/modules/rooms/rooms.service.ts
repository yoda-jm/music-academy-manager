import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { getPaginationParams, paginatedResponse } from '../../common/utils/pagination.util';
import { CreateRoomDto, UpdateRoomDto } from './dto/room.dto';

@Injectable()
export class RoomsService {
  private readonly logger = new Logger(RoomsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(pagination: PaginationDto) {
    const { skip, take } = getPaginationParams(pagination);

    const where: any = {};
    if (pagination.search) {
      where.OR = [
        { name: { contains: pagination.search, mode: 'insensitive' } },
        { floor: { contains: pagination.search, mode: 'insensitive' } },
      ];
    }

    const [rooms, total] = await Promise.all([
      this.prisma.room.findMany({
        where,
        skip,
        take,
        include: { _count: { select: { courses: true } } },
        orderBy: { name: 'asc' },
      }),
      this.prisma.room.count({ where }),
    ]);

    return paginatedResponse(rooms, total, pagination.page || 1, take);
  }

  async findOne(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        courses: {
          where: { isActive: true },
          include: {
            teacher: { include: { user: { include: { profile: true } } } },
            instrument: true,
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException(`Room with id ${id} not found`);
    }

    return room;
  }

  async create(dto: CreateRoomDto) {
    const room = await this.prisma.room.create({
      data: {
        name: dto.name,
        capacity: dto.capacity ?? 1,
        equipment: dto.equipment || [],
        color: dto.color || '#3B82F6',
        floor: dto.floor,
        notes: dto.notes,
      },
    });

    this.logger.log(`Room created: ${room.name}`);
    return room;
  }

  async update(id: string, dto: UpdateRoomDto) {
    await this.findOne(id);

    return this.prisma.room.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.room.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getSchedule(roomId: string, startDate: Date, endDate: Date) {
    await this.findOne(roomId);

    return this.prisma.courseSession.findMany({
      where: {
        course: { roomId },
        startTime: { gte: startDate, lte: endDate },
        isCancelled: false,
      },
      include: {
        course: {
          include: {
            teacher: { include: { user: { include: { profile: true } } } },
            instrument: true,
            enrollments: { where: { status: 'ACTIVE' } },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }
}

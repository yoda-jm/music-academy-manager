import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { getPaginationParams, paginatedResponse } from '../../common/utils/pagination.util';
import { CreateInstrumentDto, UpdateInstrumentDto } from './dto/instrument.dto';

@Injectable()
export class InstrumentsService {
  private readonly logger = new Logger(InstrumentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(pagination: PaginationDto) {
    const { skip, take } = getPaginationParams(pagination);

    const where: any = {};
    if (pagination.search) {
      where.OR = [
        { name: { contains: pagination.search, mode: 'insensitive' } },
        { category: { contains: pagination.search, mode: 'insensitive' } },
      ];
    }

    const [instruments, total] = await Promise.all([
      this.prisma.instrument.findMany({
        where,
        skip,
        take,
        include: {
          _count: { select: { teachers: true, students: true, courses: true } },
        },
        orderBy: pagination.sortBy
          ? { [pagination.sortBy]: pagination.sortOrder }
          : { name: 'asc' },
      }),
      this.prisma.instrument.count({ where }),
    ]);

    return paginatedResponse(instruments, total, pagination.page || 1, take);
  }

  async findOne(id: string) {
    const instrument = await this.prisma.instrument.findUnique({
      where: { id },
      include: {
        teachers: {
          include: { teacher: { include: { user: { include: { profile: true } } } } },
        },
        _count: { select: { students: true, courses: true } },
      },
    });

    if (!instrument) {
      throw new NotFoundException(`Instrument with id ${id} not found`);
    }

    return instrument;
  }

  async create(dto: CreateInstrumentDto) {
    const instrument = await this.prisma.instrument.create({
      data: dto,
    });

    this.logger.log(`Instrument created: ${instrument.name}`);
    return instrument;
  }

  async update(id: string, dto: UpdateInstrumentDto) {
    await this.findOne(id);

    return this.prisma.instrument.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.instrument.delete({ where: { id } });
  }
}

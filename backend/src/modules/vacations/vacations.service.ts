import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { getPaginationParams, paginatedResponse } from '../../common/utils/pagination.util';
import { CreateVacationDto, UpdateVacationDto, VacationQueryDto } from './dto/vacation.dto';

@Injectable()
export class VacationsService {
  private readonly logger = new Logger(VacationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: VacationQueryDto, year?: number) {
    const { skip, take } = getPaginationParams({ page: query.page, limit: query.limit });

    const where: any = {};

    const filterYear = year || query.year;
    if (filterYear) {
      const startOfYear = new Date(`${filterYear}-01-01`);
      const endOfYear = new Date(`${filterYear}-12-31`);
      where.OR = [
        { startDate: { gte: startOfYear, lte: endOfYear } },
        { endDate: { gte: startOfYear, lte: endOfYear } },
      ];
    } else if (query.startDate || query.endDate) {
      const conditions: any[] = [];
      if (query.startDate) conditions.push({ endDate: { gte: new Date(query.startDate) } });
      if (query.endDate) conditions.push({ startDate: { lte: new Date(query.endDate) } });
      if (conditions.length > 0) where.AND = conditions;
    }

    if (query.type) {
      where.type = query.type;
    }

    const [vacations, total] = await Promise.all([
      this.prisma.vacation.findMany({
        where,
        skip,
        take,
        orderBy: { startDate: 'asc' },
      }),
      this.prisma.vacation.count({ where }),
    ]);

    return paginatedResponse(vacations, total, query.page || 1, take);
  }

  async findOne(id: string) {
    const vacation = await this.prisma.vacation.findUnique({ where: { id } });

    if (!vacation) {
      throw new NotFoundException(`Vacation with id ${id} not found`);
    }

    return vacation;
  }

  async create(dto: CreateVacationDto) {
    const vacation = await this.prisma.vacation.create({
      data: {
        name: dto.name,
        startDate: dto.startDate,
        endDate: dto.endDate,
        type: dto.type || 'SCHOOL_HOLIDAY',
        affectsCourses: dto.affectsCourses ?? true,
        color: dto.color || '#F59E0B',
      },
    });

    this.logger.log(`Vacation created: ${vacation.name}`);
    return vacation;
  }

  async update(id: string, dto: UpdateVacationDto) {
    await this.findOne(id);

    return this.prisma.vacation.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.vacation.delete({ where: { id } });
  }

  async checkDate(date: Date) {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    const vacations = await this.prisma.vacation.findMany({
      where: {
        startDate: { lte: checkDate },
        endDate: { gte: checkDate },
      },
    });

    return {
      date: checkDate,
      isVacation: vacations.length > 0,
      vacations,
    };
  }
}

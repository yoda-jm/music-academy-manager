import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateAcademyConfigDto } from './dto/settings.dto';

const SINGLETON_ID = 'singleton';
const DEFAULT_CONFIG = { openTime: 8, closeTime: 22, openDays: [1, 2, 3, 4, 5, 6] };

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAcademyConfig() {
    const config = await this.prisma.academyConfig.findUnique({ where: { id: SINGLETON_ID } });
    return config ?? { id: SINGLETON_ID, ...DEFAULT_CONFIG, updatedAt: new Date() };
  }

  async updateAcademyConfig(dto: UpdateAcademyConfigDto) {
    return this.prisma.academyConfig.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, ...DEFAULT_CONFIG, ...dto },
      update: dto,
    });
  }
}

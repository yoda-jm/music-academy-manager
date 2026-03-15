import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEventDto, UpdateEventDto, AddParticipantDto } from './dto/events.dto';
import { EventFileType } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly eventInclude = {
    participants: {
      include: {
        user: { include: { profile: true } },
      },
    },
    files: true,
    _count: { select: { participants: true, files: true } },
  };

  async findAll(params?: { upcoming?: boolean }) {
    const where: any = {};
    if (params?.upcoming) {
      where.startDate = { gte: new Date() };
    }
    return this.prisma.event.findMany({
      where,
      include: this.eventInclude,
      orderBy: { startDate: 'asc' },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: this.eventInclude,
    });
    if (!event) throw new NotFoundException(`Event ${id} not found`);
    return event;
  }

  async create(dto: CreateEventDto) {
    return this.prisma.event.create({
      data: {
        name: dto.name,
        description: dto.description,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isAllDay: dto.isAllDay ?? false,
        location: dto.location,
        isPublic: dto.isPublic ?? true,
      },
      include: this.eventInclude,
    });
  }

  async update(id: string, dto: UpdateEventDto) {
    await this.findOne(id);
    return this.prisma.event.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
        ...(dto.isAllDay !== undefined && { isAllDay: dto.isAllDay }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
      },
      include: this.eventInclude,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    // Delete associated files from disk
    const event = await this.prisma.event.findUnique({ where: { id }, include: { files: true } });
    if (event?.files) {
      for (const file of event.files) {
        const filePath = path.join(process.env.UPLOAD_DIR || '/app/uploads', 'events', path.basename(file.fileUrl));
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    }
    await this.prisma.event.delete({ where: { id } });
  }

  async addParticipant(eventId: string, dto: AddParticipantDto) {
    await this.findOne(eventId);
    const existing = await this.prisma.eventParticipant.findUnique({
      where: { eventId_userId: { eventId, userId: dto.userId } },
    });
    if (existing) throw new ConflictException('User is already a participant');
    return this.prisma.eventParticipant.create({
      data: { eventId, userId: dto.userId, role: dto.role, notes: dto.notes },
      include: { user: { include: { profile: true } } },
    });
  }

  async removeParticipant(eventId: string, userId: string) {
    await this.findOne(eventId);
    await this.prisma.eventParticipant.deleteMany({ where: { eventId, userId } });
  }

  async addFile(
    eventId: string,
    file: Express.Multer.File,
    fileType: EventFileType,
  ) {
    await this.findOne(eventId);
    const fileUrl = `/uploads/events/${file.filename}`;
    return this.prisma.eventFile.create({
      data: {
        eventId,
        name: file.originalname,
        fileUrl,
        fileType,
        mimeType: file.mimetype,
        size: file.size,
      },
    });
  }

  async removeFile(eventId: string, fileId: string) {
    const file = await this.prisma.eventFile.findFirst({ where: { id: fileId, eventId } });
    if (!file) throw new NotFoundException('File not found');
    const uploadDir = process.env.UPLOAD_DIR || '/app/uploads';
    const filePath = path.join(uploadDir, 'events', path.basename(file.fileUrl));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await this.prisma.eventFile.delete({ where: { id: fileId } });
  }
}

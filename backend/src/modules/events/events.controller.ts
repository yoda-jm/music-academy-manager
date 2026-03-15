import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto, AddParticipantDto } from './dto/events.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role, EventFileType } from '@prisma/client';

const multerStorage = diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = join(process.env.UPLOAD_DIR || '/app/uploads', 'events');
    const fs = require('fs');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${extname(file.originalname)}`);
  },
});

@ApiTags('events')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'List all events' })
  findAll(@Query('upcoming') upcoming?: string) {
    return this.eventsService.findAll({ upcoming: upcoming === 'true' });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event detail' })
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Create event' })
  create(@Body() dto: CreateEventDto) {
    return this.eventsService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Update event' })
  update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.eventsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Delete event' })
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }

  @Post(':id/participants')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Add participant to event' })
  addParticipant(@Param('id') id: string, @Body() dto: AddParticipantDto) {
    return this.eventsService.addParticipant(id, dto);
  }

  @Delete(':id/participants/:userId')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Remove participant from event' })
  removeParticipant(@Param('id') id: string, @Param('userId') userId: string) {
    return this.eventsService.removeParticipant(id, userId);
  }

  @Post(':id/files')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Upload file attachment to event' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' }, fileType: { type: 'string', enum: Object.values(EventFileType) } } } })
  @UseInterceptors(FileInterceptor('file', { storage: multerStorage }))
  uploadFile(
    @Param('id') id: string,
    @UploadedFile(new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 })] })) file: Express.Multer.File,
    @Body('fileType') fileType: EventFileType,
  ) {
    return this.eventsService.addFile(id, file, fileType || EventFileType.OTHER);
  }

  @Delete(':id/files/:fileId')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Delete file attachment from event' })
  removeFile(@Param('id') id: string, @Param('fileId') fileId: string) {
    return this.eventsService.removeFile(id, fileId);
  }
}

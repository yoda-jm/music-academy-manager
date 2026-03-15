import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SchedulingService } from './scheduling.service';
import { UpdateSessionDto } from './dto/scheduling.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('scheduling')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('scheduling')
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Get('calendar')
  @ApiOperation({ summary: 'Get all sessions for a date range (calendar view)' })
  @ApiQuery({ name: 'start', required: true, type: String })
  @ApiQuery({ name: 'end', required: true, type: String })
  @ApiQuery({ name: 'teacherId', required: false })
  @ApiQuery({ name: 'roomId', required: false })
  @ApiQuery({ name: 'studentId', required: false })
  async getCalendar(
    @Query('start') start: string,
    @Query('end') end: string,
    @Query('teacherId') teacherId?: string,
    @Query('roomId') roomId?: string,
    @Query('studentId') studentId?: string,
  ) {
    return this.schedulingService.getCalendar(new Date(start), new Date(end), { teacherId, roomId, studentId });
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get session detail with attendance' })
  async getSession(@Param('id') id: string) {
    return this.schedulingService.getSession(id);
  }

  @Patch('sessions/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Update session status, cancel, or reschedule' })
  async updateSession(@Param('id') id: string, @Body() dto: UpdateSessionDto) {
    return this.schedulingService.updateSession(id, dto);
  }

  @Get('conflicts')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Check for scheduling conflicts' })
  @ApiQuery({ name: 'teacherId', required: false })
  @ApiQuery({ name: 'roomId', required: false })
  @ApiQuery({ name: 'start', required: true })
  @ApiQuery({ name: 'end', required: true })
  @ApiQuery({ name: 'excludeSessionId', required: false })
  async checkConflicts(
    @Query('start') start: string,
    @Query('end') end: string,
    @Query('teacherId') teacherId?: string,
    @Query('roomId') roomId?: string,
    @Query('excludeSessionId') excludeSessionId?: string,
  ) {
    return this.schedulingService.checkConflicts({
      teacherId,
      roomId,
      startDate: new Date(start),
      endDate: new Date(end),
      excludeSessionId,
    });
  }
}

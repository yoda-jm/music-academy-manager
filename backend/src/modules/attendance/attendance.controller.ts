import {
  Controller,
  Get,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { UpdateAttendanceDto, BulkUpdateAttendanceDto } from './dto/attendance.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('attendance')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('session/:sessionId')
  @ApiOperation({ summary: 'Get all attendance for a session' })
  async getSessionAttendance(@Param('sessionId') sessionId: string) {
    return this.attendanceService.getSessionAttendance(sessionId);
  }

  @Put('session/:sessionId')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Bulk update attendance for a session' })
  async bulkUpdateAttendance(
    @Param('sessionId') sessionId: string,
    @Body() dto: BulkUpdateAttendanceDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.attendanceService.bulkUpdateAttendance(sessionId, dto, currentUser.id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Update a single attendance record' })
  async updateAttendance(
    @Param('id') id: string,
    @Body() dto: UpdateAttendanceDto,
  ) {
    return this.attendanceService.updateAttendance(id, dto);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get student attendance history' })
  @ApiQuery({ name: 'start', required: false })
  @ApiQuery({ name: 'end', required: false })
  async getStudentAttendance(
    @Param('studentId') studentId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.attendanceService.getStudentAttendance(
      studentId,
      start ? new Date(start) : undefined,
      end ? new Date(end) : undefined,
    );
  }

  @Get('stats/:courseId')
  @ApiOperation({ summary: 'Get attendance statistics for a course' })
  async getCourseAttendanceStats(@Param('courseId') courseId: string) {
    return this.attendanceService.getCourseAttendanceStats(courseId);
  }
}

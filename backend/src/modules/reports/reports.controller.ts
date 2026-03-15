import {
  Controller,
  Get,
  Query,
  UseGuards,
  Param,
  Res,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('reports')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard-stats')
  @ApiOperation({ summary: 'Get dashboard overview stats' })
  async getDashboardStats() {
    return this.reportsService.getDashboardStats();
  }

  @Get('attendance')
  @ApiOperation({ summary: 'Get attendance report for a course and date range' })
  @ApiQuery({ name: 'courseId', required: true })
  @ApiQuery({ name: 'start', required: true })
  @ApiQuery({ name: 'end', required: true })
  @ApiQuery({ name: 'format', required: false, enum: ['json', 'csv'] })
  async getAttendanceReport(
    @Query('courseId') courseId: string,
    @Query('start') start: string,
    @Query('end') end: string,
    @Query('format') format: 'json' | 'csv' = 'json',
    @Res({ passthrough: true }) res: Response,
  ) {
    const report = await this.reportsService.getAttendanceReport(
      courseId,
      new Date(start),
      new Date(end),
      format,
    );

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="attendance-${courseId}-${start}.csv"`,
      );
      return report;
    }

    return report;
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Revenue breakdown by month, payment method' })
  @ApiQuery({ name: 'start', required: true })
  @ApiQuery({ name: 'end', required: true })
  async getRevenueReport(
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return this.reportsService.getRevenueReport(new Date(start), new Date(end));
  }

  @Get('students')
  @ApiOperation({ summary: 'Enrollment statistics and active students per instrument' })
  async getStudentsReport() {
    return this.reportsService.getStudentsReport();
  }

  @Get('teacher-hours')
  @ApiOperation({ summary: 'Teaching hours report for a teacher' })
  @ApiQuery({ name: 'teacherId', required: true })
  @ApiQuery({ name: 'start', required: true })
  @ApiQuery({ name: 'end', required: true })
  async getTeacherHoursReport(
    @Query('teacherId') teacherId: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return this.reportsService.getTeacherHoursReport(
      teacherId,
      new Date(start),
      new Date(end),
    );
  }
}

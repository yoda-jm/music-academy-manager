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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  CreateCourseDto,
  UpdateCourseDto,
  GenerateSessionsDto,
  EnrollStudentDto,
} from './dto/course.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('courses')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all courses' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'teacherId', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('type') type?: string,
    @Query('teacherId') teacherId?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.coursesService.findAll(pagination, {
      type,
      teacherId,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Create a course' })
  async create(@Body() dto: CreateCourseDto) {
    return this.coursesService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course by ID' })
  async findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Update course' })
  async update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.coursesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Deactivate course (soft delete)' })
  async remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }

  @Post(':id/sessions/generate')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Generate sessions from RRULE, skipping vacation dates' })
  async generateSessions(
    @Param('id') id: string,
    @Body() dto: GenerateSessionsDto,
  ) {
    return this.coursesService.generateSessions(id, dto);
  }

  @Get(':id/sessions')
  @ApiOperation({ summary: 'Get all sessions for a course' })
  async getSessions(
    @Param('id') id: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.coursesService.getSessions(id, pagination);
  }

  @Get(':id/enrollments')
  @ApiOperation({ summary: 'Get all enrollments for a course' })
  async getEnrollments(@Param('id') id: string) {
    return this.coursesService.getEnrollments(id);
  }

  @Post(':id/enroll')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Enroll a student in a course' })
  async enrollStudent(
    @Param('id') id: string,
    @Body() dto: EnrollStudentDto,
  ) {
    return this.coursesService.enrollStudent(id, dto);
  }

  @Delete(':id/enroll/:studentId')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Unenroll a student from a course' })
  async unenrollStudent(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    return this.coursesService.unenrollStudent(id, studentId);
  }
}

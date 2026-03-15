import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateStudentDto, UpdateStudentDto, SetStudentInstrumentsDto } from './dto/student.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('students')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.RECEPTIONIST, Role.TEACHER)
  @ApiOperation({ summary: 'Get all students' })
  async findAll(@Query() pagination: PaginationDto) {
    return this.studentsService.findAll(pagination);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Create student profile' })
  async create(@Body() dto: CreateStudentDto) {
    return this.studentsService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get student by ID' })
  async findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Update student profile' })
  async update(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.studentsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Delete student (fails if student has enrollments or attendance)' })
  async remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }

  @Get(':id/instruments')
  @ApiOperation({ summary: 'Get student instruments' })
  async getInstruments(@Param('id') id: string) {
    return this.studentsService.getInstruments(id);
  }

  @Put(':id/instruments')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Set student instruments (replaces all)' })
  async setInstruments(
    @Param('id') id: string,
    @Body() dto: SetStudentInstrumentsDto,
  ) {
    return this.studentsService.setInstruments(id, dto);
  }

  @Get(':id/enrollments')
  @ApiOperation({ summary: 'Get student enrollments' })
  async getEnrollments(
    @Param('id') id: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.studentsService.getEnrollments(id, currentUser);
  }

  @Get(':id/attendance')
  @ApiOperation({ summary: 'Get student attendance history' })
  @ApiQuery({ name: 'start', required: false })
  @ApiQuery({ name: 'end', required: false })
  async getAttendance(
    @Param('id') id: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @CurrentUser() currentUser?: any,
  ) {
    return this.studentsService.getAttendance(
      id,
      start ? new Date(start) : undefined,
      end ? new Date(end) : undefined,
      currentUser,
    );
  }
}

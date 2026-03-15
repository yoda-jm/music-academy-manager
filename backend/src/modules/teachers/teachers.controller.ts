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
import { TeachersService } from './teachers.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  CreateTeacherDto,
  UpdateTeacherDto,
  SetTeacherAvailabilityDto,
  SetTeacherInstrumentsDto,
} from './dto/teacher.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('teachers')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all teachers' })
  async findAll(@Query() pagination: PaginationDto) {
    return this.teachersService.findAll(pagination);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Create teacher profile' })
  async create(@Body() dto: CreateTeacherDto) {
    return this.teachersService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get teacher by ID' })
  async findOne(@Param('id') id: string) {
    return this.teachersService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Update teacher profile' })
  async update(@Param('id') id: string, @Body() dto: UpdateTeacherDto) {
    return this.teachersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Delete teacher (fails if teacher has active courses)' })
  async remove(@Param('id') id: string) {
    return this.teachersService.remove(id);
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Get teacher availability' })
  async getAvailability(@Param('id') id: string) {
    return this.teachersService.getAvailability(id);
  }

  @Put(':id/availability')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Set teacher availability (replaces all)' })
  async setAvailability(
    @Param('id') id: string,
    @Body() dto: SetTeacherAvailabilityDto,
  ) {
    return this.teachersService.setAvailability(id, dto);
  }

  @Get(':id/instruments')
  @ApiOperation({ summary: 'Get teacher instruments / qualifications' })
  async getInstruments(@Param('id') id: string) {
    return this.teachersService.getInstruments(id);
  }

  @Put(':id/instruments')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Set teacher instruments (replaces all)' })
  async setInstruments(
    @Param('id') id: string,
    @Body() dto: SetTeacherInstrumentsDto,
  ) {
    return this.teachersService.setInstruments(id, dto);
  }

  @Get(':id/schedule')
  @ApiOperation({ summary: 'Get teacher upcoming schedule' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getSchedule(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.teachersService.getSchedule(
      id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}

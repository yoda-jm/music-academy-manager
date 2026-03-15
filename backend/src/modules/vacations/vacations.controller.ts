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
import { VacationsService } from './vacations.service';
import { CreateVacationDto, UpdateVacationDto, VacationQueryDto } from './dto/vacation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('vacations')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vacations')
export class VacationsController {
  constructor(private readonly vacationsService: VacationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all vacations, optionally filtered by year' })
  async findAll(@Query() query: VacationQueryDto) {
    return this.vacationsService.findAll(query, query.year);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Create vacation period' })
  async create(@Body() dto: CreateVacationDto) {
    return this.vacationsService.create(dto);
  }

  @Get('check')
  @ApiOperation({ summary: 'Check if a date is a vacation' })
  @ApiQuery({ name: 'date', required: true, type: String })
  async checkDate(@Query('date') date: string) {
    return this.vacationsService.checkDate(new Date(date));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vacation by ID' })
  async findOne(@Param('id') id: string) {
    return this.vacationsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Update vacation' })
  async update(@Param('id') id: string, @Body() dto: UpdateVacationDto) {
    return this.vacationsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Delete vacation' })
  async remove(@Param('id') id: string) {
    return this.vacationsService.remove(id);
  }
}

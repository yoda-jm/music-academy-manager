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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FamiliesService } from './families.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateFamilyDto, UpdateFamilyDto, AddFamilyMemberDto } from './dto/create-family.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('families')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('families')
export class FamiliesController {
  constructor(private readonly familiesService: FamiliesService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Get all families' })
  async findAll(@Query() pagination: PaginationDto) {
    return this.familiesService.findAll(pagination);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Create a new family' })
  async create(@Body() dto: CreateFamilyDto) {
    return this.familiesService.create(dto);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Get family by ID' })
  async findOne(@Param('id') id: string) {
    return this.familiesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Update family' })
  async update(@Param('id') id: string, @Body() dto: UpdateFamilyDto) {
    return this.familiesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Delete family' })
  async remove(@Param('id') id: string) {
    return this.familiesService.remove(id);
  }

  @Post(':id/members')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Add member to family' })
  async addMember(
    @Param('id') id: string,
    @Body() dto: AddFamilyMemberDto,
  ) {
    return this.familiesService.addMember(id, dto);
  }

  @Delete(':id/members/:userId')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Remove member from family' })
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.familiesService.removeMember(id, userId);
  }
}

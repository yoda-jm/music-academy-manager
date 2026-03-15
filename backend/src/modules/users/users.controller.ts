import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Get all users (admin only)' })
  @ApiQuery({ name: 'roles', required: false, isArray: true, enum: Role })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('roles') roles?: Role | Role[],
  ) {
    const rolesArray = roles
      ? Array.isArray(roles)
        ? roles
        : [roles]
      : undefined;
    return this.usersService.findAll(pagination, rolesArray);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() currentUser: any) {
    if (
      currentUser.role === Role.STUDENT ||
      currentUser.role === Role.PARENT ||
      currentUser.role === Role.TEACHER
    ) {
      if (currentUser.id !== id) {
        throw new Error('Forbidden: You can only view your own profile');
      }
    }
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.usersService.update(id, dto, currentUser);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Soft delete user (admin only)' })
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Get(':id/profile')
  @ApiOperation({ summary: 'Get user profile' })
  async getProfile(@Param('id') id: string) {
    return this.usersService.getProfile(id);
  }

  @Patch(':id/profile')
  @ApiOperation({ summary: 'Update user profile' })
  async updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateProfileDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.usersService.updateProfile(id, dto, currentUser);
  }
}

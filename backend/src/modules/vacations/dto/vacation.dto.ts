import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsBoolean, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { VacationType } from '@prisma/client';

export class CreateVacationDto {
  @ApiProperty({ example: 'Christmas Break 2026' })
  @IsString()
  name: string;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @ApiPropertyOptional({ enum: VacationType, default: VacationType.SCHOOL_HOLIDAY })
  @IsEnum(VacationType)
  @IsOptional()
  type?: VacationType;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  affectsCourses?: boolean;

  @ApiPropertyOptional({ default: '#F59E0B' })
  @IsString()
  @IsOptional()
  color?: string;
}

export class UpdateVacationDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional()
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  endDate?: Date;

  @ApiPropertyOptional({ enum: VacationType })
  @IsEnum(VacationType)
  @IsOptional()
  type?: VacationType;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  affectsCourses?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  color?: string;
}

export class VacationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by year' })
  @Type(() => Number)
  @IsOptional()
  year?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ enum: VacationType })
  @IsEnum(VacationType)
  @IsOptional()
  type?: VacationType;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 100 })
  @Type(() => Number)
  @IsOptional()
  limit?: number;
}

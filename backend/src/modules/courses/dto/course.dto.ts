import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  IsBoolean,
  IsNumber,
  Min,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CourseType, PaymentType, EnrollmentStatus } from '@prisma/client';

export class CreateCourseDto {
  @ApiProperty({ example: 'Piano Beginners Tuesday' })
  @IsString()
  name: string;

  @ApiProperty({ enum: CourseType })
  @IsEnum(CourseType)
  type: CourseType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsString()
  teacherId: string;

  @ApiProperty()
  @IsString()
  roomId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  instrumentId?: string;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  maxStudents?: number;

  @ApiPropertyOptional({ default: 60 })
  @Type(() => Number)
  @IsInt()
  @Min(15)
  @IsOptional()
  durationMinutes?: number;

  @ApiPropertyOptional({ default: '#8B5CF6' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ description: 'RRULE string for recurring sessions, e.g. FREQ=WEEKLY;BYDAY=MO;BYHOUR=10;BYMINUTE=0' })
  @IsString()
  @IsOptional()
  recurrenceRule?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  pricePerSession?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  priceMonthly?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  priceYearly?: number;
}

export class UpdateCourseDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: CourseType })
  @IsEnum(CourseType)
  @IsOptional()
  type?: CourseType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  teacherId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  roomId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  instrumentId?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  maxStudents?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  @IsOptional()
  durationMinutes?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  recurrenceRule?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  pricePerSession?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  priceMonthly?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  priceYearly?: number;
}

export class GenerateSessionsDto {
  @ApiProperty({ example: '2026-01-01' })
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @ApiProperty({ example: '2026-06-30' })
  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @ApiPropertyOptional({ description: 'Skip vacation date check', default: false })
  @IsBoolean()
  @IsOptional()
  skipVacationCheck?: boolean;
}

export class EnrollStudentDto {
  @ApiProperty()
  @IsString()
  studentId: string;

  @ApiPropertyOptional({ enum: PaymentType, default: PaymentType.PER_SESSION })
  @IsEnum(PaymentType)
  @IsOptional()
  paymentType?: PaymentType;

  @ApiPropertyOptional()
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

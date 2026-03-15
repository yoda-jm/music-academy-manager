import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
  IsInt,
  IsEmail,
  MinLength,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTeacherDto {
  // --- new user path ---
  @ApiPropertyOptional({ description: 'Email for new user account' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Password for new user account', minLength: 8 })
  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  // --- existing user path ---
  @ApiPropertyOptional({ description: 'User ID to create teacher profile for (existing user)' })
  @IsString()
  @IsOptional()
  userId?: string;

  // --- common fields ---
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({ example: 60.00 })
  @IsNumber()
  @IsOptional()
  hourlyRate?: number;
}

export class UpdateTeacherDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  hourlyRate?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class TeacherInstrumentDto {
  @ApiProperty()
  @IsString()
  instrumentId: string;

  @ApiPropertyOptional({ default: 'INTERMEDIATE' })
  @IsString()
  @IsOptional()
  level?: string;
}

export class TeacherAvailabilityDto {
  @ApiProperty({ example: 1, description: '0=Sun, 1=Mon, ..., 6=Sat' })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ example: '09:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: '17:00' })
  @IsString()
  endTime: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;
}

export class SetTeacherAvailabilityDto {
  @ApiProperty({ type: [TeacherAvailabilityDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeacherAvailabilityDto)
  availability: TeacherAvailabilityDto[];
}

export class SetTeacherInstrumentsDto {
  @ApiProperty({ type: [TeacherInstrumentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeacherInstrumentDto)
  instruments: TeacherInstrumentDto[];
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsDate,
  IsEmail,
  IsBoolean,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStudentDto {
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

  @ApiPropertyOptional({ description: 'Date of birth (ISO string)' })
  @IsString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  // --- existing user path ---
  @ApiPropertyOptional({ description: 'User ID to create student profile for (existing user)' })
  @IsString()
  @IsOptional()
  userId?: string;

  // --- common fields ---
  @ApiPropertyOptional({ description: 'Family ID to associate student with' })
  @IsString()
  @IsOptional()
  familyId?: string;
}

export class UpdateStudentDto {
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
  dateOfBirth?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  familyId?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class StudentInstrumentDto {
  @ApiProperty()
  @IsString()
  instrumentId: string;

  @ApiPropertyOptional({ default: 'BEGINNER' })
  @IsString()
  @IsOptional()
  level?: string;

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

export class SetStudentInstrumentsDto {
  @ApiProperty({ type: [StudentInstrumentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentInstrumentDto)
  instruments: StudentInstrumentDto[];
}

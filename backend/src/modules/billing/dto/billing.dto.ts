import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDate,
  IsArray,
  IsBoolean,
  ValidateNested,
  Min,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CourseType,
  InvoiceStatus,
  PaymentMethod,
} from '@prisma/client';

export class CreatePricingRuleDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ enum: CourseType })
  @IsEnum(CourseType)
  @IsOptional()
  courseType?: CourseType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  instrumentId?: string;

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

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class UpdatePricingRuleDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: CourseType })
  @IsEnum(CourseType)
  @IsOptional()
  courseType?: CourseType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  instrumentId?: string;

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

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class InvoiceItemDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  studentId?: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  courseId?: string;
}

export class CreateInvoiceDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  familyId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  studentId?: string;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  periodStart: Date;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  periodEnd: Date;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  dueDate: Date;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: [InvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];
}

export class UpdateInvoiceDto {
  @ApiPropertyOptional({ enum: InvoiceStatus })
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;

  @ApiPropertyOptional()
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dueDate?: Date;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class RecordPaymentDto {
  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiPropertyOptional()
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  paidAt?: Date;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class InvoiceQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ enum: InvoiceStatus })
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  familyId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  studentId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  endDate?: string;
}

export class GenerateInvoicesDto {
  @ApiProperty({ description: 'Period start date' })
  @Type(() => Date)
  @IsDate()
  periodStart: Date;

  @ApiProperty({ description: 'Period end date' })
  @Type(() => Date)
  @IsDate()
  periodEnd: Date;

  @ApiProperty({ description: 'Invoice due date' })
  @Type(() => Date)
  @IsDate()
  dueDate: Date;

  @ApiPropertyOptional({ description: 'Only generate for specific family' })
  @IsString()
  @IsOptional()
  familyId?: string;
}

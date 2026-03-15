import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';
import { SessionStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class UpdateSessionDto {
  @ApiPropertyOptional({ enum: SessionStatus })
  @IsEnum(SessionStatus)
  @IsOptional()
  status?: SessionStatus;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isCancelled?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  cancelReason?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @Type(() => Date)
  @IsOptional()
  startTime?: Date;

  @ApiPropertyOptional()
  @Type(() => Date)
  @IsOptional()
  endTime?: Date;
}

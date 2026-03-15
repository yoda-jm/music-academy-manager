import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { NotifType } from '@prisma/client';

export class NotificationFilterDto {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isRead?: boolean;

  @ApiPropertyOptional({ enum: NotifType })
  @IsEnum(NotifType)
  @IsOptional()
  type?: NotifType;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsArray, Min, Max } from 'class-validator';

export class UpdateAcademyConfigDto {
  @ApiPropertyOptional({ example: 8, description: 'Opening hour (0-23)' })
  @IsInt()
  @Min(0)
  @Max(23)
  @IsOptional()
  openTime?: number;

  @ApiPropertyOptional({ example: 22, description: 'Closing hour (0-23)' })
  @IsInt()
  @Min(0)
  @Max(23)
  @IsOptional()
  closeTime?: number;

  @ApiPropertyOptional({ example: [1, 2, 3, 4, 5, 6], description: '0=Sun,1=Mon,...,6=Sat' })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  openDays?: number[];
}

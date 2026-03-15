import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateInstrumentDto {
  @ApiProperty({ example: 'Ukulele' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'String' })
  @IsString()
  category: string;
}

export class UpdateInstrumentDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;
}

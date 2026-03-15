import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';

export class CreateFamilyDto {
  @ApiProperty({ example: 'Smith Family' })
  @IsString()
  @MinLength(1)
  name: string;
}

export class AddFamilyMemberDto {
  @ApiProperty({ example: 'user-id-here' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ example: 'PARENT' })
  @IsString()
  @IsOptional()
  relation?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  isPrimary?: boolean;
}

export class UpdateFamilyDto {
  @ApiPropertyOptional({ example: 'Johnson Family' })
  @IsString()
  @IsOptional()
  name?: string;
}

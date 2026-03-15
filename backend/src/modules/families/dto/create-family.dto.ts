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

  @ApiPropertyOptional({ example: '12 Rue de la Paix' })
  @IsString()
  @IsOptional()
  billingAddress?: string;

  @ApiPropertyOptional({ example: 'Paris' })
  @IsString()
  @IsOptional()
  billingCity?: string;

  @ApiPropertyOptional({ example: '75001' })
  @IsString()
  @IsOptional()
  billingPostal?: string;
}

export class UpdateFamilyMemberDto {
  @ApiPropertyOptional({ example: 'PARENT' })
  @IsString()
  @IsOptional()
  relation?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  isPrimary?: boolean;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray } from 'class-validator';
import { ConvType } from '@prisma/client';

export class CreateConversationDto {
  @ApiPropertyOptional({ example: 'Group Chat Name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ enum: ConvType, default: ConvType.DIRECT })
  @IsEnum(ConvType)
  type: ConvType;

  @ApiProperty({ type: [String], description: 'User IDs to add to conversation' })
  @IsArray()
  @IsString({ each: true })
  participantIds: string[];
}

export class SendMessageDto {
  @ApiProperty()
  @IsString()
  conversationId: string;

  @ApiProperty()
  @IsString()
  content: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];
}

export class EditMessageDto {
  @ApiProperty()
  @IsString()
  content: string;
}

export class SendMessageBodyDto {
  @ApiProperty()
  @IsString()
  content: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];
}

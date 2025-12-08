import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminUpdateProfileDto {
  @ApiPropertyOptional({ example: '김관리', description: '관리자 이름' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;
}

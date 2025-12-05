import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsPhoneNumber, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: '홍길동', description: '이름' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ example: 'user@example.com', description: '이메일' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '010-1234-5678', description: '전화번호' })
  @IsOptional()
  @IsPhoneNumber('KR')
  phoneNumber?: string;

  @ApiPropertyOptional({ example: '세무법인 투게더', description: '소속' })
  @IsOptional()
  @IsString()
  affiliation?: string;
}


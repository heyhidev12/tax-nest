import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { AdminRole } from 'src/libs/enums/admin.enum';

export class CreateAdminDto {
  @ApiProperty({ example: 'admin01', description: '관리자 로그인 ID (4-20자)' })
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  loginId: string;

  @ApiProperty({ example: 'password123', description: '비밀번호 (8-16자)' })
  @IsString()
  @MinLength(8)
  @MaxLength(16)
  password: string;

  @ApiProperty({ example: '김관리', description: '관리자 이름' })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({ example: 'ADMIN', enum: AdminRole, description: '관리자 역할' })
  @IsOptional()
  @IsEnum(AdminRole)
  role?: AdminRole;
}


import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { AdminRole } from 'src/libs/enums/admin.enum';
import { IsValidLoginId } from 'src/libs/validators/login-id.validator';
import { IsStrongPassword } from 'src/libs/validators/password.validator';

export class CreateAdminDto {
  @ApiProperty({ example: 'admin01', description: '관리자 로그인 ID (6-20자 영문/숫자)' })
  @IsValidLoginId()
  loginId: string;

  @ApiProperty({ example: 'password123!', description: '비밀번호 (8-16자, 영문/숫자/특수문자 중 2가지 이상 조합)' })
  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @MaxLength(16, { message: '비밀번호는 최대 16자까지 가능합니다.' })
  @IsStrongPassword()
  password: string;

  @ApiProperty({ example: '김관리', description: '관리자 이름' })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({ example: 'ADMIN', enum: AdminRole, description: '관리자 역할' })
  @IsOptional()
  @IsEnum(AdminRole)
  role?: AdminRole;

  @ApiPropertyOptional({ 
    example: { content: true, members: false }, 
    description: '메뉴 권한 객체 (예: { "content": true, "members": false })',
    type: 'object',
    additionalProperties: { type: 'boolean' },
  })
  @IsOptional()
  permissions?: Record<string, boolean>;
}

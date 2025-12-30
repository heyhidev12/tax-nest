import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';
import { IsValidLoginId } from 'src/libs/validators/login-id.validator';
import { IsStrongPassword } from 'src/libs/validators/password.validator';

export class AdminLoginDto {
  @ApiProperty({ example: 'superadmin', description: '관리자 로그인 ID (6-20자 영문/숫자)' })
  @IsValidLoginId()
  loginId: string;

  @ApiProperty({ example: 'admin12', description: '관리자 비밀번호 (8-16자, 영문/숫자/특수문자 중 2가지 이상 조합)' })
  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @MaxLength(16, { message: '비밀번호는 최대 16자까지 가능합니다.' })
  @IsStrongPassword()
  password: string;

  @ApiPropertyOptional({ example: false, description: '자동 로그인 여부' })
  @IsOptional()
  @IsBoolean()
  autoLogin?: boolean;
}

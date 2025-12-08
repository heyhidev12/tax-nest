import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { IsValidLoginId } from 'src/libs/validators/login-id.validator';

export class LoginDto {
  @ApiProperty({ example: 'user123', description: '로그인 ID (6-20자 영문/숫자)' })
  @IsValidLoginId()
  loginId: string;

  @ApiProperty({ example: 'password123!', description: '비밀번호' })
  @IsString()
  password: string;

  @ApiPropertyOptional({ example: false, description: '자동 로그인 여부' })
  @IsOptional()
  @IsBoolean()
  autoLogin?: boolean;
}

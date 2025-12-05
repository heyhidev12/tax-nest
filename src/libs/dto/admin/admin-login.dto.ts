import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({ example: 'superadmin', description: '관리자 로그인 ID' })
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  loginId: string;

  @ApiProperty({ example: 'admin1234', description: '관리자 비밀번호' })
  @IsString()
  @MinLength(8)
  @MaxLength(16)
  password: string;
}

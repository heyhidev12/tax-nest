import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator';
import { IsValidLoginId } from 'src/libs/validators/login-id.validator';
import { IsStrongPassword } from 'src/libs/validators/password.validator';

export class FindPasswordDto {
  @ApiProperty({ example: 'user123', description: '로그인 ID' })
  @IsValidLoginId()
  loginId: string;

  @ApiProperty({ example: '홍길동', description: '회원 이름' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'user@example.com', description: '이메일' })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: '비밀번호 재설정 토큰' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'newpassword123!', description: '새 비밀번호 (8-16자, 영문/숫자/특수문자 중 2가지 이상 조합)' })
  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @MaxLength(16, { message: '비밀번호는 최대 16자까지 가능합니다.' })
  @IsStrongPassword()
  newPassword: string;

  @ApiProperty({ example: 'newpassword123!', description: '새 비밀번호 확인' })
  @IsString()
  @IsNotEmpty({ message: '새 비밀번호 확인을 입력해주세요.' })
  newPasswordConfirm: string;
}

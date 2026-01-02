import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, IsNotEmpty, Length, Matches } from 'class-validator';
import { IsValidLoginId } from 'src/libs/validators/login-id.validator';
import { IsStrongPassword } from 'src/libs/validators/password.validator';

export class FindPasswordByEmailDto {
  @ApiProperty({ example: 'user123', description: '로그인 ID' })
  @IsValidLoginId()
  loginId: string;

  @ApiProperty({ example: 'user@example.com', description: '이메일' })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email: string;

  @ApiProperty({ example: '1234', description: '이메일 인증번호 (4자리)' })
  @IsString()
  @Matches(/^\d{4}$/, { message: '인증번호는 4자리 숫자여야 합니다.' })
  verificationCode: string;
}

export class FindPasswordByPhoneDto {
  @ApiProperty({ example: 'user123', description: '로그인 ID' })
  @IsValidLoginId()
  loginId: string;

  @ApiProperty({ example: '01012345678', description: '휴대폰 번호' })
  @IsString()
  @Matches(/^01[0-9]{8,9}$/, { message: '올바른 휴대폰 번호 형식이 아닙니다.' })
  phoneNumber: string;

  @ApiProperty({ example: '1234', description: '인증번호 (4자리)' })
  @IsString()
  @Matches(/^\d{4}$/, { message: '인증번호는 4자리 숫자여야 합니다.' })
  verificationCode: string;
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

// DTOs for requesting verification codes (for password reset)
export class RequestPasswordResetEmailVerificationDto {
  @ApiProperty({ example: 'user123', description: '로그인 ID' })
  @IsValidLoginId()
  loginId: string;

  @ApiProperty({ example: 'user@example.com', description: '이메일' })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email: string;
}

export class RequestPasswordResetPhoneVerificationDto {
  @ApiProperty({ example: 'user123', description: '로그인 ID' })
  @IsValidLoginId()
  loginId: string;

  @ApiProperty({ example: '01012345678', description: '휴대폰 번호' })
  @IsString()
  @Matches(/^01[0-9]{8,9}$/, { message: '올바른 휴대폰 번호 형식이 아닙니다.' })
  phoneNumber: string;
}

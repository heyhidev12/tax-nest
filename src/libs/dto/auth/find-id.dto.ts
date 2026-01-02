import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, IsNotEmpty, Length } from 'class-validator';

export class FindIdByEmailDto {
  @ApiProperty({ example: '홍길동', description: '회원 이름' })
  @IsString()
  @IsNotEmpty({ message: '이름을 입력해주세요.' })
  name: string;

  @ApiProperty({ example: 'user@example.com', description: '이메일' })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email: string;

  @ApiProperty({ example: '1234', description: '이메일 인증번호 (4자리)' })
  @IsString()
  @Matches(/^\d{4}$/, { message: '인증번호는 4자리 숫자여야 합니다.' })
  verificationCode: string;
}

export class FindIdByPhoneDto {
  @ApiProperty({ example: '홍길동', description: '회원 이름' })
  @IsString()
  @IsNotEmpty({ message: '이름을 입력해주세요.' })
  name: string;

  @ApiProperty({ example: '01012345678', description: '휴대폰 번호' })
  @IsString()
  @Matches(/^01[0-9]{8,9}$/, { message: '올바른 휴대폰 번호 형식이 아닙니다.' })
  phoneNumber: string;

  @ApiProperty({ example: '1234', description: '인증번호 (4자리)' })
  @IsString()
  @Matches(/^\d{4}$/, { message: '인증번호는 4자리 숫자여야 합니다.' })
  verificationCode: string;
}

// DTOs for requesting verification codes
export class RequestEmailVerificationDto {
  @ApiProperty({ example: 'user@example.com', description: '이메일' })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email: string;
}

export class RequestPhoneVerificationDto {
  @ApiProperty({ example: '01012345678', description: '휴대폰 번호' })
  @IsString()
  @Matches(/^01[0-9]{8,9}$/, { message: '올바른 휴대폰 번호 형식이 아닙니다.' })
  phoneNumber: string;
}

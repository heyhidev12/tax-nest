import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsPhoneNumber, IsString, MinLength, MaxLength } from 'class-validator';
import { MemberType } from 'src/libs/enums/members.enum';

export class SignUpDto {
  @ApiProperty({ example: 'user@example.com', description: '로그인 ID (이메일)' })
  @IsEmail()
  loginId: string;

  @ApiProperty({ example: 'password123', description: '비밀번호 (8-16자)' })
  @IsString()
  @MinLength(8)
  @MaxLength(16)
  password: string;

  @ApiProperty({ example: '홍길동', description: '회원 이름 (최대 6자)' })
  @IsString()
  @MaxLength(6)
  name: string;

  @ApiProperty({ example: 'user@example.com', description: '이메일' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '010-1234-5678', description: '전화번호' })
  @IsPhoneNumber('KR')
  phoneNumber: string;

  @ApiProperty({ example: 'GENERAL', enum: MemberType, description: '회원 유형' })
  @IsEnum(MemberType)
  memberType: MemberType;

  @ApiProperty({ example: true, description: '약관 동의 여부' })
  @IsNotEmpty()
  termsAgreed: boolean;
}

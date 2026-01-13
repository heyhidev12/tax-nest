import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { MemberType } from 'src/libs/enums/members.enum';
import { IsStrongPassword } from 'src/libs/validators/password.validator';
import { IsValidLoginId } from 'src/libs/validators/login-id.validator';
import { IsKoreanEnglishName } from 'src/libs/validators/korean-english-name.validator';

export class SignUpDto {
  @ApiProperty({ example: 'user123', description: '로그인 ID (6-20자 영문/숫자)' })
  @IsValidLoginId()
  loginId: string;

  @ApiProperty({ example: 'password123!', description: '비밀번호 (8-16자, 영문/숫자/특수문자 중 2가지 이상 조합)' })
  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @MaxLength(16, { message: '비밀번호는 최대 16자까지 가능합니다.' })
  @IsStrongPassword()
  password: string;

  @ApiProperty({ example: 'password123!', description: '비밀번호 확인' })
  @IsString()
  @IsNotEmpty({ message: '비밀번호 확인을 입력해주세요.' })
  passwordConfirm: string;

  @ApiProperty({ example: '홍길동', description: '회원 이름 (최대 6자, 한글/영문만)' })
  @IsKoreanEnglishName()
  name: string;

  @ApiProperty({ example: 'user@example.com', description: '이메일' })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email: string;

  @ApiProperty({ example: '01012345678', description: '전화번호 (숫자만)' })
  @IsString()
  @Matches(/^0[0-9]{9,10}$/, { message: '올바른 휴대폰 번호 형식이 아닙니다.' })
  phoneNumber: string;

  @ApiProperty({ example: 'GENERAL', enum: MemberType, description: '회원 유형 (GENERAL: 일반회원, OTHER: 법인대표/직원, INSURANCE: 보험사 직원)' })
  @IsEnum(MemberType, { message: '올바른 회원 유형을 선택해주세요.' })
  memberType: MemberType;

  @ApiProperty({ example: true, description: '뉴스레터 구독 여부', required: false, default: false })
  newsletters?: boolean;

  @ApiProperty({ example: true, description: '약관 동의 여부' })
  @IsNotEmpty({ message: '약관에 동의해주세요.' })
  termsAgreed: boolean;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { MemberType } from 'src/libs/enums/members.enum';
import { IsValidLoginId } from 'src/libs/validators/login-id.validator';
import { IsStrongPassword } from 'src/libs/validators/password.validator';
import { IsKoreanEnglishName } from 'src/libs/validators/korean-english-name.validator';

export class AdminCreateMemberDto {
  @ApiProperty({ example: 'GENERAL', enum: MemberType, description: '회원 유형 (GENERAL: 일반회원, OTHER: 법인대표/직원, INSURANCE: 보험사 직원)' })
  @IsEnum(MemberType, { message: '올바른 회원 유형을 선택해주세요.' })
  memberType: MemberType;

  @ApiProperty({ example: 'user123', description: '로그인 ID (6-20자 영문/숫자)' })
  @IsValidLoginId()
  loginId: string;

  @ApiProperty({ example: '홍길동', description: '회원 이름 (최대 6자, 한글/영문만)' })
  @IsKoreanEnglishName()
  name: string;

  @ApiProperty({ example: 'user@example.com', description: '이메일' })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email: string;

  @ApiProperty({ example: 'password123!', description: '비밀번호 (8-16자, 영문/숫자/특수문자 중 2가지 이상 조합)' })
  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @MaxLength(16, { message: '비밀번호는 최대 16자까지 가능합니다.' })
  @IsStrongPassword()
  password: string;

  @ApiProperty({ example: '01012345678', description: '휴대폰 번호 (숫자만)' })
  @IsString()
  @Matches(/^01[0-9]{8,9}$/, { message: '올바른 휴대폰 번호 형식이 아닙니다.' })
  phoneNumber: string;

  @ApiPropertyOptional({ example: false, description: '뉴스레터 구독 여부' })
  @IsOptional()
  @IsBoolean()
  newsletterSubscribed?: boolean;

  @ApiPropertyOptional({ example: '삼성화재', description: '소속 (보험사 이름 등)' })
  @IsOptional()
  @IsString()
  affiliation?: string;
}

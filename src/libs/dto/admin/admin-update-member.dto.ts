import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { MemberStatus, MemberType } from 'src/libs/enums/members.enum';
import { IsKoreanEnglishName } from 'src/libs/validators/korean-english-name.validator';

export class AdminUpdateMemberDto {
  @ApiPropertyOptional({ enum: MemberType, description: '회원 유형 (GENERAL: 일반회원, OTHER: 법인대표/직원, INSURANCE: 보험사 직원)' })
  @IsOptional()
  @IsEnum(MemberType)
  memberType?: MemberType;

  @ApiPropertyOptional({ description: '회원 이름 (최대 6자, 한글/영문만)' })
  @IsOptional()
  @IsKoreanEnglishName()
  name?: string;

  @ApiPropertyOptional({ description: '이메일' })
  @IsOptional()
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email?: string;

  @ApiPropertyOptional({ description: '전화번호 (숫자만)' })
  @IsOptional()
  @IsString()
  @Matches(/^01[0-9]{8,9}$/, { message: '올바른 휴대폰 번호 형식이 아닙니다.' })
  phoneNumber?: string;

  @ApiPropertyOptional({ description: '소속 (보험사 이름 등)' })
  @IsOptional()
  @IsString()
  affiliation?: string;

  @ApiPropertyOptional({ description: '뉴스레터 구독 여부' })
  @IsOptional()
  @IsBoolean()
  newsletterSubscribed?: boolean;

  @ApiPropertyOptional({ description: '회원 상태 (ACTIVE: 이용중, WITHDRAWN: 탈퇴)' })
  @IsOptional()
  @IsEnum(MemberStatus)
  status?: MemberStatus;

  @ApiPropertyOptional({ description: '승인 여부 (보험사 회원용)' })
  @IsOptional()
  @IsBoolean()
  isApproved?: boolean;
}

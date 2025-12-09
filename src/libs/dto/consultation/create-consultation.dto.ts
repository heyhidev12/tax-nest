import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { MemberFlag } from 'src/libs/enums/members.enum';
import { IsKoreanEnglishName } from 'src/libs/validators/korean-english-name.validator';

export class CreateConsultationDto {
  @ApiProperty({ example: '홍길동', description: '이름 (필수)' })
  @IsKoreanEnglishName()
  @IsNotEmpty({ message: '이름을 입력해주세요.' })
  name: string;

  @ApiProperty({ example: '01012345678', description: '휴대폰 번호 (필수, 숫자만)' })
  @IsString()
  @IsNotEmpty({ message: '휴대폰 번호를 입력해주세요.' })
  @Matches(/^[0-9]+$/, { message: '전화번호는 숫자만 입력 가능합니다.' })
  phoneNumber: string;

  @ApiProperty({ example: '세무조정', description: '상담 분야 (필수)' })
  @IsString()
  @IsNotEmpty({ message: '상담 분야를 선택해주세요.' })
  consultingField: string;

  @ApiProperty({ example: '김세무', description: '담당 세무사 (필수)' })
  @IsString()
  @IsNotEmpty({ message: '담당 세무사를 선택해주세요.' })
  assignedTaxAccountant: string;

  @ApiProperty({ example: '상담 내용입니다.', description: '상담 내용 (필수)' })
  @IsString()
  @IsNotEmpty({ message: '상담 내용을 입력해주세요.' })
  content: string;

  @ApiProperty({ example: true, description: '개인정보 처리 방침 이용 동의 (필수)' })
  @IsBoolean()
  @IsNotEmpty({ message: '개인정보 처리 방침 이용에 동의해주세요.' })
  privacyAgreed: boolean;

  @ApiProperty({ example: true, description: '이용 동의 (필수)' })
  @IsBoolean()
  @IsNotEmpty({ message: '이용 동의에 동의해주세요.' })
  termsAgreed: boolean;

  @ApiPropertyOptional({ example: 'MEMBER', enum: MemberFlag, description: '회원/비회원 구분 (시스템 자동 설정)' })
  @IsOptional()
  @IsEnum(MemberFlag)
  memberFlag?: MemberFlag;
}

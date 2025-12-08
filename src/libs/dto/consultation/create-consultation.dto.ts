import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { MemberFlag } from 'src/libs/enums/members.enum';
import { IsKoreanEnglishName } from 'src/libs/validators/korean-english-name.validator';

export class CreateConsultationDto {
  @ApiProperty({ example: '홍길동', description: '이름 (최대 6자, 한글/영문만, 숫자 불가)' })
  @IsKoreanEnglishName()
  name: string;

  @ApiProperty({ example: 'user@example.com', description: '이메일 (@ 및 도메인 구분자 필수)' })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다. 공백, @ 누락, 도메인 구분자(.) 확인해주세요.' })
  email: string;

  @ApiProperty({ example: '1234', description: '비밀번호 (4-8자리 숫자만)' })
  @IsString()
  @Matches(/^[0-9]{4,8}$/, { message: '비밀번호는 4~8자리 숫자만 입력 가능합니다.' })
  password: string;

  @ApiProperty({ example: '01012345678', description: '휴대폰 번호 (숫자만)' })
  @IsString()
  @Matches(/^[0-9]+$/, { message: '전화번호는 숫자만 입력 가능합니다.' })
  phoneNumber: string;

  @ApiProperty({ example: '세무조정', description: '상담 분야' })
  @IsString()
  @IsNotEmpty({ message: '상담 분야를 선택해주세요.' })
  consultingField: string;

  @ApiPropertyOptional({ example: '삼성화재', description: '보험사 이름 (회원으로 등록된 보험사 선택)' })
  @IsOptional()
  @IsString()
  insuranceCompanyName?: string;

  @ApiProperty({ example: '서울특별시', description: '거주 지역' })
  @IsString()
  @IsNotEmpty({ message: '거주 지역을 입력해주세요.' })
  residenceArea: string;

  @ApiProperty({ example: '상담 내용입니다.', description: '상담 내용' })
  @IsString()
  @IsNotEmpty({ message: '상담 내용을 입력해주세요.' })
  content: string;

  @ApiProperty({ example: true, description: '개인정보 수집/이용 동의 여부 (필수)' })
  @IsNotEmpty({ message: '개인정보 수집/이용에 동의해주세요.' })
  privacyAgreed: boolean;

  @ApiPropertyOptional({ example: 'MEMBER', enum: MemberFlag, description: '회원/비회원 구분' })
  @IsOptional()
  @IsEnum(MemberFlag)
  memberFlag?: MemberFlag;
}

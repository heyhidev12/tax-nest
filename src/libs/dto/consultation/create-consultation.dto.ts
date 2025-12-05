import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { MemberFlag } from 'src/libs/enums/members.enum';

export class CreateConsultationDto {
  @ApiProperty({ example: '홍길동', description: '이름 (최대 6자)' })
  @IsString()
  @MaxLength(6)
  name: string;

  @ApiProperty({ example: 'user@example.com', description: '이메일' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '1234', description: '비밀번호 (4-8자리 숫자)' })
  @IsString()
  @MinLength(4)
  @MaxLength(8)
  password: string;

  @ApiProperty({ example: '010-1234-5678', description: '전화번호' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ example: '세무조정', description: '상담 분야' })
  @IsString()
  consultingField: string;

  @ApiPropertyOptional({ example: '삼성화재', description: '보험사 이름' })
  @IsOptional()
  @IsString()
  insuranceCompanyName?: string;

  @ApiProperty({ example: '서울', description: '거주 지역' })
  @IsString()
  residenceArea: string;

  @ApiProperty({ example: '상담 내용입니다.', description: '상담 내용' })
  @IsString()
  content: string;

  @ApiProperty({ example: true, description: '개인정보 동의 여부' })
  @IsNotEmpty()
  privacyAgreed: boolean;

  @ApiPropertyOptional({ example: 'MEMBER', enum: MemberFlag, description: '회원/비회원 구분' })
  @IsOptional()
  @IsEnum(MemberFlag)
  memberFlag?: MemberFlag;
}

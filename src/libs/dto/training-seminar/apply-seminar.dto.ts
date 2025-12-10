import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsDateString, IsInt, Min, IsOptional, IsBoolean } from 'class-validator';

export class ApplySeminarDto {
  @ApiProperty({ example: '홍길동', description: '신청자 이름 (필수)' })
  @IsString()
  @IsNotEmpty({ message: '이름을 입력해주세요.' })
  name: string;

  @ApiProperty({ example: '01012345678', description: '휴대폰 번호 (필수, 숫자만)' })
  @IsString()
  @IsNotEmpty({ message: '휴대폰 번호를 입력해주세요.' })
  phoneNumber: string;

  @ApiProperty({ example: 'user@example.com', description: '이메일 (필수)' })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  @IsNotEmpty({ message: '이메일을 입력해주세요.' })
  email: string;

  @ApiProperty({ example: '2026-06-13', description: '참여 일자 (필수, YYYY-MM-DD 형식)' })
  @IsDateString({}, { message: '올바른 날짜 형식이 아닙니다. (YYYY-MM-DD)' })
  @IsNotEmpty({ message: '참여 일자를 선택해주세요.' })
  participationDate: string;

  @ApiProperty({ example: '16:00~17:00', description: '참여 시간 (필수, HH:mm~HH:mm 형식)' })
  @IsString()
  @IsNotEmpty({ message: '참여 시간을 선택해주세요.' })
  participationTime: string;

  @ApiProperty({ example: 1, description: '참석 인원 (필수, 신청자 포함, 최소 1명)' })
  @IsInt({ message: '참석 인원은 숫자여야 합니다.' })
  @Min(1, { message: '참석 인원은 최소 1명 이상이어야 합니다.' })
  attendeeCount: number;

  @ApiPropertyOptional({ example: '추가 참석인원이 있는 경우 요청사항에 인원 수를 작성해주세요.', description: '요청사항 (선택)' })
  @IsOptional()
  @IsString()
  requestDetails?: string;

  @ApiProperty({ example: true, description: '개인정보 수집 및 이용 동의 (필수)' })
  @IsBoolean()
  @IsNotEmpty({ message: '개인정보 수집 및 이용에 동의해주세요.' })
  privacyAgreed: boolean;
}

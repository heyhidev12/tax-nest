import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches } from 'class-validator';
import { IsKoreanEnglishName } from 'src/libs/validators/korean-english-name.validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: '홍길동', description: '이름 (최대 6자, 한글/영문만)' })
  @IsOptional()
  @IsKoreanEnglishName()
  name?: string;

  @ApiPropertyOptional({ example: 'user@example.com', description: '이메일' })
  @IsOptional()
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email?: string;

  @ApiPropertyOptional({ example: '01012345678', description: '전화번호 (숫자만)' })
  @IsOptional()
  @IsString()
  @Matches(/^01[0-9]{8,9}$/, { message: '올바른 휴대폰 번호 형식이 아닙니다.' })
  phoneNumber?: string;

  @ApiPropertyOptional({ example: '세무법인 투게더', description: '소속' })
  @IsOptional()
  @IsString()
  affiliation?: string;
}

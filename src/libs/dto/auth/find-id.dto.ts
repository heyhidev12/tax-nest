import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches } from 'class-validator';

export class FindIdDto {
  @ApiProperty({ example: '홍길동', description: '회원 이름' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'user@example.com', description: '이메일' })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email: string;
}

export class FindIdByPhoneDto {
  @ApiProperty({ example: '홍길동', description: '회원 이름' })
  @IsString()
  name: string;

  @ApiProperty({ example: '01012345678', description: '전화번호' })
  @IsString()
  @Matches(/^01[0-9]{8,9}$/, { message: '올바른 휴대폰 번호 형식이 아닙니다.' })
  phoneNumber: string;
}

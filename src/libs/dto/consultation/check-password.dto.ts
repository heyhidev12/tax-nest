import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class CheckPasswordDto {
  @ApiProperty({ example: '1234', description: '비밀번호 (4-8자리 숫자)' })
  @IsString()
  @Matches(/^[0-9]{4,8}$/, { message: '비밀번호는 4~8자리 숫자만 입력 가능합니다.' })
  password: string;
}

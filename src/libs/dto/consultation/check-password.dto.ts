import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class CheckPasswordDto {
  @ApiProperty({ example: '1234', description: '비밀번호 (4-8자리)' })
  @IsString()
  @MinLength(4)
  @MaxLength(8)
  password: string;
}

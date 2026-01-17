import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class WithdrawAccountDto {
  @ApiProperty({ example: 'user-password', description: '비밀번호 (회원 탈퇴 확인용)' })
  @IsNotEmpty({ message: '비밀번호를 입력해주세요.' })
  @IsString()
  password: string;
}

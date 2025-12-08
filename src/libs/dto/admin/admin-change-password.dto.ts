import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator';
import { IsStrongPassword } from 'src/libs/validators/password.validator';

export class AdminChangePasswordDto {
  @ApiProperty({ example: 'oldpassword', description: '현재 비밀번호' })
  @IsString()
  @IsNotEmpty({ message: '현재 비밀번호를 입력해주세요.' })
  currentPassword: string;

  @ApiProperty({ example: 'newpassword123!', description: '새 비밀번호 (8-16자, 영문/숫자/특수문자 중 2가지 이상 조합)' })
  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @MaxLength(16, { message: '비밀번호는 최대 16자까지 가능합니다.' })
  @IsStrongPassword()
  newPassword: string;

  @ApiProperty({ example: 'newpassword123!', description: '새 비밀번호 확인' })
  @IsString()
  @IsNotEmpty({ message: '새 비밀번호 확인을 입력해주세요.' })
  newPasswordConfirm: string;
}

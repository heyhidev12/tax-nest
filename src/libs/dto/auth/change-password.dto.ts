import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'oldpassword', description: '현재 비밀번호' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'newpassword123', description: '새 비밀번호 (8-16자)' })
  @IsString()
  @MinLength(8)
  @MaxLength(16)
  newPassword: string;
}


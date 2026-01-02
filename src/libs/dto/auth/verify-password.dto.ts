import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class VerifyPasswordDto {
    @ApiProperty({ example: 'user_current_password', description: '현재 비밀번호' })
    @IsString()
    password: string;
}

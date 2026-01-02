import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class SendPhoneVerificationDto {
    @ApiProperty({ example: '01012345678', description: '휴대폰 번호 (숫자만)' })
    @IsString()
    @Matches(/^010\d{8}$/)
    phone: string;
}

export class VerifyPhoneCodeDto {
    @ApiProperty({ example: '01012345678', description: '휴대폰 번호 (숫자만)' })
    @IsString()
    @Matches(/^010\d{8}$/)
    phone: string;

    @ApiProperty({ example: '1234', description: '인증코드 (4자리)' })
    @IsString()
    @Matches(/^\d{4}$/)
    code: string;
}

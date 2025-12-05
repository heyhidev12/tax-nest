import { IsEmail, IsEnum, IsNotEmpty, IsPhoneNumber, IsString, MinLength, MaxLength } from 'class-validator';
import { MemberType } from 'src/libs/enums/members.enum';

export class SignUpDto {
  @IsEmail()
  loginId: string; // 이메일 기반 ID

  @IsString()
  @MinLength(8)
  @MaxLength(16)
  password: string;

  @IsString()
  @MaxLength(6)
  name: string;

  @IsEmail()
  email: string;

  @IsPhoneNumber('KR')
  phoneNumber: string;

  @IsEnum(MemberType)
  memberType: MemberType;

  // 약관 동의는 boolean으로 받을 수 있음
  @IsNotEmpty()
  termsAgreed: boolean;
}

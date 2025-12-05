import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateConsultationDto {
  @IsString()
  @MaxLength(6)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(4)
  @MaxLength(8)
  password: string; // 숫자만 입력하도록 프론트에서 제한

  @IsString()
  phoneNumber: string;

  @IsString()
  consultingField: string;

  @IsString()
  insuranceCompanyName?: string;

  @IsString()
  residenceArea: string;

  @IsString()
  content: string;

  @IsNotEmpty()
  privacyAgreed: boolean;
}

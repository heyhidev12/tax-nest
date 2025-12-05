import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  loginId: string;

  @IsString()
  password: string;
}


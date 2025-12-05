import { IsString, MinLength, MaxLength } from 'class-validator';

export class AdminLoginDto {
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  loginId: string;

  @IsString()
  @MinLength(8)
  @MaxLength(16)
  password: string;
}

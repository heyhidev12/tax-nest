import { IsString, MinLength, MaxLength } from 'class-validator';

export class CheckPasswordDto {
  @IsString()
  @MinLength(4)
  @MaxLength(8)
  password: string;
}

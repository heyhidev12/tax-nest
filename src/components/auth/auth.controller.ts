import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';


import {
  RequestEmailVerificationDto,
  RequestPhoneVerificationDto,
  FindIdByEmailDto,
  FindIdByPhoneDto,
} from 'src/libs/dto/auth/find-id.dto';

import {
  RequestPasswordResetEmailVerificationDto,
  RequestPasswordResetPhoneVerificationDto,
  FindPasswordByEmailDto,
  FindPasswordByPhoneDto,
  ResetPasswordDto,
} from 'src/libs/dto/auth/find-password.dto';
import { SignUpDto } from 'src/libs/dto/auth/sign-up.dto';
import { LoginDto } from 'src/libs/dto/auth/login.dto';
import { UpdateProfileDto } from 'src/libs/dto/auth/update-profile.dto';
import { ChangePasswordDto } from 'src/libs/dto/auth/change-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // -------------------------------------
  // SIGN UP / LOGIN
  // -------------------------------------

  @Post('sign-up')
  signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // -------------------------------------
  // MY PAGE
  // -------------------------------------

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyProfile(@Req() req: any) {
    return this.authService.getMyProfile(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.sub, dto);
  }

  // -------------------------------------
  // FIND ID — SEND VERIFICATION
  // -------------------------------------

  @Post('find-id/email/send')
  sendFindIdEmailVerification(@Body() dto: RequestEmailVerificationDto) {
    return this.authService.requestFindIdEmailVerification(dto);
  }

  @Post('find-id/phone/send')
  sendFindIdPhoneVerification(@Body() dto: RequestPhoneVerificationDto) {
    return this.authService.requestFindIdPhoneVerification(dto);
  }

  // -------------------------------------
  // FIND ID — VERIFY RESULT
  // -------------------------------------

  @Post('find-id/email/verify')
  findIdByEmail(@Body() dto: FindIdByEmailDto) {
    return this.authService.findIdByEmail(dto);
  }

  @Post('find-id/phone/verify')
  findIdByPhone(@Body() dto: FindIdByPhoneDto) {
    return this.authService.findIdByPhone(dto);
  }

  // -------------------------------------
  // FIND PASSWORD — SEND VERIFICATION
  // -------------------------------------

  @Post('find-password/email/send')
  sendResetPasswordEmailVerification(
    @Body() dto: RequestPasswordResetEmailVerificationDto,
  ) {
    return this.authService.requestPasswordResetEmailVerification(dto);
  }

  @Post('find-password/phone/send')
  sendResetPasswordPhoneVerification(
    @Body() dto: RequestPasswordResetPhoneVerificationDto,
  ) {
    return this.authService.requestPasswordResetPhoneVerification(dto);
  }

  // -------------------------------------
  // FIND PASSWORD — VERIFY
  // -------------------------------------

  @Post('find-password/email/verify')
  findPasswordByEmail(@Body() dto: FindPasswordByEmailDto) {
    return this.authService.findPasswordByEmail(dto);
  }

  @Post('find-password/phone/verify')
  findPasswordByPhone(@Body() dto: FindPasswordByPhoneDto) {
    return this.authService.findPasswordByPhone(dto);
  }

  // -------------------------------------
  // PASSWORD RESET (after verification)
  // -------------------------------------

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}

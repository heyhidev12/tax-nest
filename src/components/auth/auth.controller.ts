import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
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
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Auth')
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

  // -------------------------------------
  // SNS LOGIN (OAuth)
  // -------------------------------------

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google 로그인 시작', description: 'Google OAuth 인증을 시작합니다. 브라우저에서 이 엔드포인트로 리다이렉트하세요.' })
  async googleAuth() {
    // Guard handles OAuth flow - this method won't be called if redirect happens
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google 로그인 콜백', description: 'Google OAuth 인증 후 콜백 엔드포인트입니다. 프론트엔드로 리다이렉트됩니다.' })
  async googleAuthCallback(@Req() req: any, @Res() res: any) {
    // After successful Google authentication
    const { accessToken, member } = req.user;
    
    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}&provider=google`);
  }

  @Get('kakao')
  @UseGuards(AuthGuard('kakao'))
  @ApiOperation({ summary: 'Kakao 로그인 시작', description: 'Kakao OAuth 인증을 시작합니다. 브라우저에서 이 엔드포인트로 리다이렉트하세요.' })
  async kakaoAuth() {
    // Guard handles OAuth flow - this method won't be called if redirect happens
  }

  @Get('kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  @ApiOperation({ summary: 'Kakao 로그인 콜백', description: 'Kakao OAuth 인증 후 콜백 엔드포인트입니다. 프론트엔드로 리다이렉트됩니다.' })
  async kakaoAuthCallback(@Req() req: any, @Res() res: any) {
    // After successful Kakao authentication
    const { accessToken, member } = req.user;
    
    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}&provider=kakao`);
  }

  @Get('naver')
  @UseGuards(AuthGuard('naver'))
  @ApiOperation({ summary: 'Naver 로그인 시작', description: 'Naver OAuth 인증을 시작합니다. 브라우저에서 이 엔드포인트로 리다이렉트하세요.' })
  async naverAuth() {
    // Guard handles OAuth flow - this method won't be called if redirect happens
  }

  @Get('naver/callback')
  @UseGuards(AuthGuard('naver'))
  @ApiOperation({ summary: 'Naver 로그인 콜백', description: 'Naver OAuth 인증 후 콜백 엔드포인트입니다. 프론트엔드로 리다이렉트됩니다.' })
  async naverAuthCallback(@Req() req: any, @Res() res: any) {
    // After successful Naver authentication
    const { accessToken, member } = req.user;
    
    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}&provider=naver`);
  }
}

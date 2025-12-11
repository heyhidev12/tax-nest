import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
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
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { TrainingSeminarService } from '../content/services/training-seminar.service';
import { ConsultationsService } from '../consultations/consultations.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly trainingSeminarService: TrainingSeminarService,
    private readonly consultationsService: ConsultationsService,
  ) {}

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

  // -------------------------------------
  // APPLICATION HISTORY
  // -------------------------------------

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '내 신청 내역 조회 (교육/세미나 및 상담)' })
  @ApiResponse({ status: 200, description: '신청 내역 조회 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiQuery({ name: 'type', required: false, enum: ['seminar', 'consultation'], description: '신청 유형 필터 (seminar: 교육/세미나, consultation: 상담신청)' })
  @ApiQuery({ name: 'search', required: false, description: '검색어 (세미나명, 상담내용 등)' })
  @ApiQuery({ name: 'startDate', required: false, description: '조회 시작일 (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: '조회 종료일 (YYYY-MM-DD)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @Get('me/applications')
  async getMyApplications(
    @Req() req: any,
    @Query('type') type?: 'seminar' | 'consultation',
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    // Get user's email from member profile - ensures we only get the authenticated user's data
    const member = await this.authService.getMyProfile(req.user.sub);
    const userEmail = member.email;

    const pageNum = Number(page);
    const limitNum = Number(limit);

    // 날짜 문자열을 Date 객체로 변환
    const startDateObj = startDate ? new Date(startDate) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;

    const options = {
      search,
      startDate: startDateObj,
      endDate: endDateObj,
      page: pageNum,
      limit: limitNum,
      sort: 'latest' as const,
    };

    // 타입별로 필터링
    if (type === 'seminar') {
      // 교육/세미나 신청만 조회 (해당 사용자의 이메일로 필터링됨)
      const seminarApplications = await this.trainingSeminarService.findUserApplications(userEmail, options);
      
      return {
        type: 'seminar',
        ...seminarApplications,
      };
    } else if (type === 'consultation') {
      // 상담 신청만 조회 (해당 사용자의 이메일로 필터링됨)
      const consultations = await this.consultationsService.findUserConsultations(userEmail, options);
      
      return {
        type: 'consultation',
        ...consultations,
      };
    } else {
      // 전체 조회 (교육/세미나 + 상담) - 모두 해당 사용자의 이메일로 필터링됨
      const [seminarApplications, consultations] = await Promise.all([
        this.trainingSeminarService.findUserApplications(userEmail, options),
        this.consultationsService.findUserConsultations(userEmail, options),
      ]);

      // 통합 응답
      return {
        type: 'all',
        seminars: seminarApplications,
        consultations: consultations,
        summary: {
          seminarTotal: seminarApplications.total,
          consultationTotal: consultations.total,
          total: seminarApplications.total + consultations.total,
        },
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '내 신청 내역 조회 - 히스토리 (교육/세미나 및 상담)' })
  @ApiResponse({ status: 200, description: '신청 내역 조회 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiQuery({ name: 'type', required: false, enum: ['seminar', 'consultation'], description: '신청 유형 필터 (seminar: 교육/세미나, consultation: 상담신청)' })
  @ApiQuery({ name: 'search', required: false, description: '검색어 (세미나명, 상담내용 등)' })
  @ApiQuery({ name: 'startDate', required: false, description: '조회 시작일 (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: '조회 종료일 (YYYY-MM-DD)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @Get('me/history')
  async getMyHistory(
    @Req() req: any,
    @Query('type') type?: 'seminar' | 'consultation',
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    // This endpoint is an alias for getMyApplications
    // It ensures users can only see their own application history
    return this.getMyApplications(req, type, search, startDate, endDate, page, limit);
  }
}

import {
  Body,
  Controller,
  Delete,
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
import { VerifyPasswordDto } from 'src/libs/dto/auth/verify-password.dto';
import { SendPhoneVerificationDto, VerifyPhoneCodeDto } from 'src/libs/dto/auth/phone-verification.dto';
import { WithdrawAccountDto } from 'src/libs/dto/auth/withdraw-account.dto';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiBearerAuth, ApiBody, ApiExcludeEndpoint } from '@nestjs/swagger';
import { TrainingSeminarService } from '../content/services/training-seminar.service';
import { ConsultationsService } from '../consultations/consultations.service';
import { ExposureSettingsService } from '../content/services/exposure-settings.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly trainingSeminarService: TrainingSeminarService,
    private readonly consultationsService: ConsultationsService,
    private readonly exposureSettingsService: ExposureSettingsService,
  ) { }

  // -------------------------------------
  // SIGN UP / LOGIN
  // -------------------------------------

  @ApiOperation({ summary: '회원가입' })
  @ApiResponse({ status: 201, description: '회원가입 성공' })
  @ApiResponse({ status: 400, description: '입력값 검증 실패 또는 이미 사용 중인 ID/이메일/전화번호' })
  @ApiBody({ type: SignUpDto })
  @Post('sign-up')
  signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto);
  }

  @ApiOperation({ summary: '아이디 중복 확인', description: '회원가입 전 아이디 중복 여부를 확인합니다.' })
  @ApiResponse({ status: 200, description: '확인 성공', schema: { example: { exists: true } } })
  @ApiQuery({ name: 'loginId', required: true, description: '확인할 로그인 ID' })
  @Get('check-id')
  checkId(@Query('loginId') loginId: string) {
    return this.authService.checkLoginIdExists(loginId);
  }

  @ApiOperation({ summary: '로그인' })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  @ApiResponse({ status: 401, description: 'ID 또는 비밀번호가 올바르지 않습니다.' })
  @ApiBody({ type: LoginDto })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // -------------------------------------
  // MY PAGE
  // -------------------------------------

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('user-auth')
  @ApiOperation({ summary: '내 프로필 조회 (인증 필요)' })
  @ApiResponse({ status: 200, description: '프로필 조회 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자 - Authorization 헤더에 Bearer 토큰이 필요합니다' })
  @Get('me')
  getMyProfile(@Req() req: any) {
    return this.authService.getMyProfile(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('user-auth')
  @ApiOperation({ summary: '프로필 수정 (인증 필요)' })
  @ApiResponse({ status: 200, description: '프로필 수정 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자 - Authorization 헤더에 Bearer 토큰이 필요합니다' })
  @ApiBody({ type: UpdateProfileDto })
  @Patch('profile')
  updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('user-auth')
  @ApiOperation({ summary: '비밀번호 변경 (인증 필요)' })
  @ApiResponse({ status: 200, description: '비밀번호 변경 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자 - Authorization 헤더에 Bearer 토큰이 필요합니다' })
  @ApiResponse({ status: 400, description: '현재 비밀번호가 올바르지 않습니다.' })
  @ApiBody({ type: ChangePasswordDto })
  @Patch('change-password')
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('user-auth')
  @ApiOperation({ summary: '비밀번호 확인 (인증 필요)', description: '프로필 수정 전 현재 비밀번호를 확인합니다.' })
  @ApiResponse({ status: 200, description: '비밀번호 확인 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자 또는 비밀번호가 올바르지 않습니다.' })
  @ApiBody({ type: VerifyPasswordDto })
  @Post('verify-password')
  verifyPassword(@Req() req: any, @Body() dto: VerifyPasswordDto) {
    return this.authService.verifyPassword(req.user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('user-auth')
  @ApiOperation({ summary: '회원 탈퇴 (인증 필요)', description: '비밀번호 확인 후 회원 탈퇴를 처리합니다. 탈퇴는 되돌릴 수 없습니다.' })
  @ApiResponse({ status: 200, description: '회원 탈퇴 성공' })
  @ApiResponse({ status: 400, description: '비밀번호가 올바르지 않습니다.' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiBody({ type: WithdrawAccountDto })
  @Delete('me')
  withdrawAccount(@Req() req: any, @Body() dto: WithdrawAccountDto) {
    return this.authService.withdrawAccount(req.user.sub, dto);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: '휴대폰 인증번호 발송', description: '회원가입 또는 휴대폰 번호 변경을 위한 인증번호를 발송합니다.' })
  @ApiResponse({ status: 200, description: '인증번호 발송 성공' })
  @ApiBody({ type: SendPhoneVerificationDto })
  @Post('phone/send')
  sendPhoneVerification(@Req() req: any, @Body() dto: SendPhoneVerificationDto) {
    return this.authService.sendPhoneVerification(dto, !!req.user);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: '휴대폰 인증번호 확인', description: '발송된 휴대폰 인증번호를 확인합니다.' })
  @ApiResponse({ status: 200, description: '인증 성공' })
  @ApiResponse({ status: 400, description: '인증번호가 올바르지 않거나 만료되었습니다.' })
  @ApiBody({ type: VerifyPhoneCodeDto })
  @Post('phone/verify')
  verifyPhoneCode(@Req() req: any, @Body() dto: VerifyPhoneCodeDto) {
    return this.authService.verifyPhoneCode(dto, !!req.user);
  }


  // -------------------------------------
  // APPLICATION HISTORY
  // -------------------------------------

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('user-auth')
  @ApiOperation({ summary: '내 신청 내역 조회 (교육/세미나 및 상담, 인증 필요)' })
  @ApiResponse({ status: 200, description: '신청 내역 조회 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자 - Authorization 헤더에 Bearer 토큰이 필요합니다' })
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
    const isExposed = await this.exposureSettingsService.isAwardsMainExposed();

    if (type === 'seminar') {
      // 교육/세미나 신청만 조회 (해당 사용자의 이메일로 필터링됨)
      const seminarApplications = await this.trainingSeminarService.findUserApplications(userEmail, options);

      return {
        type: 'seminar',
        ...seminarApplications,
        isExposed,
      };
    } else if (type === 'consultation') {
      // 상담 신청만 조회 (해당 사용자의 이메일로 필터링됨)
      const consultations = await this.consultationsService.findUserConsultations(member.id, userEmail, options);

      return {
        type: 'consultation',
        ...consultations,
        isExposed,
      };
    } else {
      // 전체 조회 (교육/세미나 + 상담) - 모두 해당 사용자의 이메일로 필터링됨
      const [seminarApplications, consultations] = await Promise.all([
        this.trainingSeminarService.findUserApplications(userEmail, options),
        this.consultationsService.findUserConsultations(member.id, userEmail, options),
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
        isExposed,
      };
    }
  }

  // -------------------------------------
  // FIND ID — SEND VERIFICATION
  // -------------------------------------

  @ApiOperation({ summary: 'ID 찾기 - 이메일 인증번호 발송' })
  @ApiResponse({ status: 200, description: '인증번호 발송 성공' })
  @ApiResponse({ status: 404, description: '해당 이메일로 가입된 회원이 없습니다.' })
  @ApiBody({ type: RequestEmailVerificationDto })
  @Post('find-id/email/send')
  sendFindIdEmailVerification(@Body() dto: RequestEmailVerificationDto) {
    return this.authService.requestFindIdEmailVerification(dto);
  }

  @ApiOperation({ summary: 'ID 찾기 - 휴대폰 인증번호 발송' })
  @ApiResponse({ status: 200, description: '인증번호 발송 성공' })
  @ApiResponse({ status: 404, description: '해당 전화번호로 가입된 회원이 없습니다.' })
  @ApiBody({ type: RequestPhoneVerificationDto })
  @Post('find-id/phone/send')
  sendFindIdPhoneVerification(@Body() dto: RequestPhoneVerificationDto) {
    return this.authService.requestFindIdPhoneVerification(dto);
  }

  // -------------------------------------
  // FIND ID — VERIFY RESULT
  // -------------------------------------

  @ApiOperation({ summary: 'ID 찾기 - 이메일 인증번호 확인 및 ID 조회' })
  @ApiResponse({ status: 200, description: 'ID 조회 성공' })
  @ApiResponse({ status: 400, description: '인증번호가 올바르지 않습니다.' })
  @ApiResponse({ status: 404, description: '해당 정보로 가입된 회원이 없습니다.' })
  @ApiBody({ type: FindIdByEmailDto })
  @Post('find-id/email/verify')
  findIdByEmail(@Body() dto: FindIdByEmailDto) {
    return this.authService.findIdByEmail(dto);
  }

  @ApiOperation({ summary: 'ID 찾기 - 휴대폰 인증번호 확인 및 ID 조회' })
  @ApiResponse({ status: 200, description: 'ID 조회 성공' })
  @ApiResponse({ status: 400, description: '인증번호가 올바르지 않습니다.' })
  @ApiResponse({ status: 404, description: '해당 정보로 가입된 회원이 없습니다.' })
  @ApiBody({ type: FindIdByPhoneDto })
  @Post('find-id/phone/verify')
  findIdByPhone(@Body() dto: FindIdByPhoneDto) {
    return this.authService.findIdByPhone(dto);
  }

  // -------------------------------------
  // FIND PASSWORD — SEND VERIFICATION
  // -------------------------------------

  @ApiOperation({ summary: '비밀번호 찾기 - 이메일 인증번호 발송' })
  @ApiResponse({ status: 200, description: '인증번호 발송 성공' })
  @ApiResponse({ status: 404, description: '해당 정보로 가입된 회원이 없습니다.' })
  @ApiBody({ type: RequestPasswordResetEmailVerificationDto })
  @Post('find-password/email/send')
  sendResetPasswordEmailVerification(
    @Body() dto: RequestPasswordResetEmailVerificationDto,
  ) {
    return this.authService.requestPasswordResetEmailVerification(dto);
  }

  @ApiOperation({ summary: '비밀번호 찾기 - 휴대폰 인증번호 발송' })
  @ApiResponse({ status: 200, description: '인증번호 발송 성공' })
  @ApiResponse({ status: 404, description: '해당 정보로 가입된 회원이 없습니다.' })
  @ApiBody({ type: RequestPasswordResetPhoneVerificationDto })
  @Post('find-password/phone/send')
  sendResetPasswordPhoneVerification(
    @Body() dto: RequestPasswordResetPhoneVerificationDto,
  ) {
    return this.authService.requestPasswordResetPhoneVerification(dto);
  }

  // -------------------------------------
  // FIND PASSWORD — VERIFY
  // -------------------------------------

  @ApiOperation({ summary: '비밀번호 찾기 - 이메일 인증번호 확인 및 비밀번호 재설정 토큰 발급' })
  @ApiResponse({ status: 200, description: '인증 성공, 비밀번호 재설정 토큰 발급' })
  @ApiResponse({ status: 400, description: '인증번호가 올바르지 않습니다.' })
  @ApiResponse({ status: 404, description: '해당 정보로 가입된 회원이 없습니다.' })
  @ApiBody({ type: FindPasswordByEmailDto })
  @Post('find-password/email/verify')
  findPasswordByEmail(@Body() dto: FindPasswordByEmailDto) {
    return this.authService.findPasswordByEmail(dto);
  }

  @ApiOperation({ summary: '비밀번호 찾기 - 휴대폰 인증번호 확인 및 비밀번호 재설정 토큰 발급' })
  @ApiResponse({ status: 200, description: '인증 성공, 비밀번호 재설정 토큰 발급' })
  @ApiResponse({ status: 400, description: '인증번호가 올바르지 않습니다.' })
  @ApiResponse({ status: 404, description: '해당 정보로 가입된 회원이 없습니다.' })
  @ApiBody({ type: FindPasswordByPhoneDto })
  @Post('find-password/phone/verify')
  findPasswordByPhone(@Body() dto: FindPasswordByPhoneDto) {
    return this.authService.findPasswordByPhone(dto);
  }

  // -------------------------------------
  // PASSWORD RESET (after verification)
  // -------------------------------------

  @ApiOperation({ summary: '비밀번호 재설정' })
  @ApiResponse({ status: 200, description: '비밀번호 재설정 성공' })
  @ApiResponse({ status: 400, description: '토큰이 유효하지 않거나 만료되었습니다.' })
  @ApiBody({ type: ResetPasswordDto })
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // -------------------------------------
  // SNS LOGIN (OAuth)
  // -------------------------------------

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google 로그인 시작' })
  async googleAuth() {
    return;
  }

  @ApiExcludeEndpoint()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req, @Res() res) {

    const { accessToken, member } = req.user;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    return res.redirect(
      `${frontendUrl}/auth/callback?token=${accessToken}&provider=google`
    );
  }

  @Get('kakao')
  @UseGuards(AuthGuard('kakao'))
  @ApiOperation({ summary: 'Kakao 로그인 시작', description: 'Kakao OAuth 인증을 시작합니다. 브라우저에서 이 엔드포인트로 리다이렉트하세요.' })
  async kakaoAuth() {
    // Guard handles OAuth flow - this method won't be called if redirect happens
  }

  @ApiExcludeEndpoint()
  @Get('kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  @ApiResponse({ status: 302, description: '프론트엔드로 리다이렉트 (토큰 포함)' })
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

  @ApiExcludeEndpoint()
  @Get('naver/callback')
  @UseGuards(AuthGuard('naver'))
  @ApiResponse({ status: 302, description: '프론트엔드로 리다이렉트 (토큰 포함)' })
  async naverAuthCallback(@Req() req: any, @Res() res: any) {
    // After successful Naver authentication
    const { accessToken, member } = req.user;
    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}&provider=naver`);
  }


}
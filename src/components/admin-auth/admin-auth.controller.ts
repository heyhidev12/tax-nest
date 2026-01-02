import { Body, Controller, Get, Patch, Post, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from 'src/libs/dto/admin/admin-login.dto';
import { AdminUpdateProfileDto } from 'src/libs/dto/admin/admin-update-profile.dto';
import { AdminChangePasswordDto } from 'src/libs/dto/admin/admin-change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Admin Auth')
@ApiBearerAuth('admin-auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) { }

  @ApiOperation({ summary: '관리자 로그인' })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  @ApiResponse({ status: 401, description: 'ID 또는 비밀번호가 올바르지 않습니다. 다시 확인해주세요.' })
  @Post('login')
  async login(
    @Body() dto: AdminLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.adminAuthService.login(dto);

    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    return {
      admin: result.admin,
    };
  }

  @ApiOperation({ summary: '토큰 갱신' })
  @ApiResponse({ status: 200, description: '토큰 갱신 성공' })
  @ApiResponse({ status: 401, description: '유효하지 않은 리프레시 토큰입니다.' })
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('리프레시 토큰이 없습니다.');
    }

    const result = await this.adminAuthService.refreshTokens(refreshToken);

    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    return {
      admin: result.admin,
    };
  }

  @ApiOperation({ summary: '로그아웃' })
  @ApiResponse({ status: 200, description: '로그아웃 성공' })
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token', { path: '/admin/auth/refresh' });
    return { success: true };
  }

  @ApiOperation({ summary: '내 정보 조회 (마이페이지)' })
  @ApiResponse({ status: 200, description: '내 정보 조회 성공' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyProfile(@Req() req: any) {
    return this.adminAuthService.getMyProfile(req.user.id);
  }

  @ApiOperation({ summary: '내 정보 수정 (이름 변경)' })
  @ApiResponse({ status: 200, description: '정보 수정 성공' })
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMyProfile(@Req() req: any, @Body() dto: AdminUpdateProfileDto) {
    return this.adminAuthService.updateMyProfile(req.user.id, dto);
  }

  @ApiOperation({ summary: '비밀번호 변경' })
  @ApiResponse({ status: 200, description: '비밀번호 변경 성공' })
  @ApiResponse({ status: 400, description: '비밀번호가 일치하지 않습니다. 다시 확인해주세요.' })
  @ApiResponse({ status: 401, description: '현재 비밀번호가 올바르지 않습니다.' })
  @UseGuards(JwtAuthGuard)
  @Patch('password')
  changePassword(@Req() req: any, @Body() dto: AdminChangePasswordDto) {
    return this.adminAuthService.changePassword(req.user.id, dto);
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: true, // Always secure as per request (or isProd ? true : true)
      sameSite: 'none',
      path: '/',
      maxAge: 30 * 60 * 1000, // 30 minutes
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/admin/auth/refresh',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
  }
}

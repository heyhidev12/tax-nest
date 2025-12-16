import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from 'src/libs/dto/admin/admin-login.dto';
import { AdminUpdateProfileDto } from 'src/libs/dto/admin/admin-update-profile.dto';
import { AdminChangePasswordDto } from 'src/libs/dto/admin/admin-change-password.dto';
import { AdminJwtAuthGuard } from './admin-jwt.guard';

@ApiTags('Admin Auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @ApiOperation({ summary: '관리자 로그인' })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  @ApiResponse({ status: 401, description: 'ID 또는 비밀번호가 올바르지 않습니다. 다시 확인해주세요.' })
  @Post('login')
  login(@Body() dto: AdminLoginDto) {
    return this.adminAuthService.login(dto);
  }

  @ApiOperation({ summary: '내 정보 조회 (마이페이지)' })
  @ApiResponse({ status: 200, description: '내 정보 조회 성공' })
  @ApiBearerAuth('admin-auth')
  @UseGuards(AdminJwtAuthGuard)
  @Get('me')
  getMyProfile(@Req() req: any) {
    return this.adminAuthService.getMyProfile(req.user.id);
  }

  @ApiOperation({ summary: '내 정보 수정 (이름 변경)' })
  @ApiResponse({ status: 200, description: '정보 수정 성공' })
  @ApiBearerAuth('admin-auth')
  @UseGuards(AdminJwtAuthGuard)
  @Patch('me')
  updateMyProfile(@Req() req: any, @Body() dto: AdminUpdateProfileDto) {
    return this.adminAuthService.updateMyProfile(req.user.id, dto);
  }

  @ApiOperation({ summary: '비밀번호 변경' })
  @ApiResponse({ status: 200, description: '비밀번호 변경 성공' })
  @ApiResponse({ status: 400, description: '비밀번호가 일치하지 않습니다. 다시 확인해주세요.' })
  @ApiResponse({ status: 401, description: '현재 비밀번호가 올바르지 않습니다.' })
  @ApiBearerAuth('admin-auth')
  @UseGuards(AdminJwtAuthGuard)
  @Patch('password')
  changePassword(@Req() req: any, @Body() dto: AdminChangePasswordDto) {
    return this.adminAuthService.changePassword(req.user.id, dto);
  }
}

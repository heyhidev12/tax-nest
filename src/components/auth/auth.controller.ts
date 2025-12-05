import { Body, Controller, Get, Patch, Post, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SignUpDto } from 'src/libs/dto/auth/sign-up.dto';
import { LoginDto } from 'src/libs/dto/auth/login.dto';
import { UpdateProfileDto } from 'src/libs/dto/auth/update-profile.dto';
import { ChangePasswordDto } from 'src/libs/dto/auth/change-password.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: '회원가입' })
  @ApiResponse({ status: 201, description: '회원가입 성공' })
  @ApiResponse({ status: 400, description: '이미 사용 중인 ID' })
  @Post('sign-up')
  signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto);
  }

  @ApiOperation({ summary: '로그인' })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: '내 정보 조회' })
  @ApiResponse({ status: 200, description: '내 정보 조회 성공' })
  @ApiBearerAuth('user-auth')
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    return this.authService.getMyProfile(req.user.userId);
  }

  @ApiOperation({ summary: '프로필 수정' })
  @ApiResponse({ status: 200, description: '프로필 수정 성공' })
  @ApiBearerAuth('user-auth')
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.userId, dto);
  }

  @ApiOperation({ summary: '비밀번호 변경' })
  @ApiResponse({ status: 200, description: '비밀번호 변경 성공' })
  @ApiResponse({ status: 401, description: '현재 비밀번호 불일치' })
  @ApiBearerAuth('user-auth')
  @UseGuards(JwtAuthGuard)
  @Patch('password')
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.userId, dto);
  }
}

import { Body, Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty, ApiBearerAuth } from '@nestjs/swagger';
import { NewsletterService } from './newsletter.service';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExposureSettingsService } from '../content/services/exposure-settings.service';

class SubscribeDto {
  @ApiProperty({ example: '홍길동', description: '이름' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'user@example.com', description: '이메일 주소' })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email: string;
}

class UnsubscribeDto {
  @ApiProperty({ example: 'user@example.com', description: '이메일 주소' })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email: string;
}

@ApiTags('Newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(
    private readonly newsletterService: NewsletterService,
    private readonly exposureSettingsService: ExposureSettingsService,
  ) {}

  @ApiOperation({ summary: '뉴스레터 구독 (이름 + 이메일)' })
  @ApiResponse({ status: 201, description: '구독 성공' })
  @ApiResponse({ status: 409, description: '이미 구독 중' })
  @Post('subscribe')
  subscribe(@Body() dto: SubscribeDto) {
    return this.newsletterService.subscribe(dto.name, dto.email);
  }

  @ApiOperation({ summary: '뉴스레터 구독 취소' })
  @ApiResponse({ status: 200, description: '구독 취소 성공' })
  @Post('unsubscribe')
  unsubscribe(@Body() dto: UnsubscribeDto) {
    return this.newsletterService.unsubscribe(dto.email);
  }

  @ApiOperation({ summary: '뉴스레터 관리 - 내 구독 정보 조회' })
  @ApiResponse({ status: 200, description: '구독 정보 조회 성공' })
  @ApiBearerAuth('user-auth')
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMySubscription(@Req() req: any) {
    const subscriptionData = await this.newsletterService.getMemberSubscription(req.user.sub);
    const isExposed = await this.exposureSettingsService.isNewsletterPageExposed();
    
    return {
      ...subscriptionData,
      isExposed,
    };
  }

  @ApiOperation({ summary: '뉴스레터 구독 취소 (인증된 회원)' })
  @ApiResponse({ status: 200, description: '구독 취소 성공' })
  @ApiBearerAuth('user-auth')
  @UseGuards(JwtAuthGuard)
  @Post('me/unsubscribe')
  unsubscribeMe(@Req() req: any) {
    return this.newsletterService.unsubscribeMember(req.user.sub);
  }
}

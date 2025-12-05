import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NewsletterService } from 'src/components/newsletter/newsletter.service';
import { AdminJwtAuthGuard } from '../admin-jwt.guard';

@ApiTags('Admin Newsletter')
@ApiBearerAuth('admin-auth')
@Controller('admin/newsletter')
@UseGuards(AdminJwtAuthGuard)
export class AdminNewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @ApiOperation({ summary: '뉴스레터 구독자 목록' })
  @ApiResponse({ status: 200, description: '목록 조회 성공' })
  @ApiQuery({ name: 'search', required: false, description: '이메일 검색' })
  @ApiQuery({ name: 'isSubscribed', required: false, description: '구독 여부 필터 (true/false)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @Get()
  list(
    @Query('search') search?: string,
    @Query('isSubscribed') isSubscribed?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const options = {
      search,
      isSubscribed: isSubscribed === 'true' ? true : isSubscribed === 'false' ? false : undefined,
      page: Number(page),
      limit: Number(limit),
    };
    return this.newsletterService.adminList(options);
  }

  @ApiOperation({ summary: '구독 상태 토글' })
  @ApiResponse({ status: 200, description: '토글 성공' })
  @Patch(':id/toggle')
  toggleSubscription(@Param('id', ParseIntPipe) id: number) {
    return this.newsletterService.toggleSubscription(id);
  }
}


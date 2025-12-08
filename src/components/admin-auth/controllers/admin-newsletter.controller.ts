import {
  Body,
  Controller,
  Delete,
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
import { AdminDeleteManyDto } from 'src/libs/dto/admin/admin-delete-many.dto';

@ApiTags('Admin Newsletter')
@ApiBearerAuth('admin-auth')
@Controller('admin/newsletter')
@UseGuards(AdminJwtAuthGuard)
export class AdminNewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @ApiOperation({ summary: '뉴스레터 구독자 목록 (검색: 이메일)' })
  @ApiResponse({ status: 200, description: '목록 조회 성공' })
  @ApiQuery({ name: 'search', required: false, description: '이메일 검색' })
  @ApiQuery({ name: 'isSubscribed', required: false, description: '수신 여부 필터 (true/false)' })
  @ApiQuery({ name: 'sort', required: false, enum: ['latest', 'oldest'], description: '정렬 (기본: latest)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @Get()
  list(
    @Query('search') search?: string,
    @Query('isSubscribed') isSubscribed?: string,
    @Query('sort') sort?: 'latest' | 'oldest',
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const options = {
      search,
      isSubscribed: isSubscribed === 'true' ? true : isSubscribed === 'false' ? false : undefined,
      sort,
      page: Number(page),
      limit: Number(limit),
    };
    return this.newsletterService.adminList(options);
  }

  @ApiOperation({ summary: '뉴스레터 구독자 상세' })
  @ApiResponse({ status: 200, description: '상세 조회 성공' })
  @Get(':id')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.newsletterService.findById(id);
  }

  @ApiOperation({ summary: '수신 여부 토글 (Y/N)' })
  @ApiResponse({ status: 200, description: '토글 성공' })
  @Patch(':id/toggle')
  toggleSubscription(@Param('id', ParseIntPipe) id: number) {
    return this.newsletterService.toggleSubscription(id);
  }

  @ApiOperation({ summary: '구독자 삭제' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.newsletterService.delete(id);
  }

  @ApiOperation({ summary: '구독자 다중 삭제' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @Delete('bulk')
  deleteMany(@Body() dto: AdminDeleteManyDto) {
    return this.newsletterService.deleteMany(dto.ids);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { NewsletterService } from 'src/components/newsletter/newsletter.service';
import { AdminBaseController } from './admin-base.controller';
import { AdminDeleteManyDto } from 'src/libs/dto/admin/admin-delete-many.dto';

@ApiTags('Admin Newsletter')
@Controller('admin/newsletter')
export class AdminNewsletterController extends AdminBaseController {
  constructor(private readonly newsletterService: NewsletterService) {
    super();
  }

  @ApiOperation({ summary: '뉴스레터 구독자 목록 (검색: 이메일)' })
  @ApiResponse({
    status: 200,
    description: '목록 조회 성공. 검색 결과가 없을 경우 message 필드에 "검색 결과 없음" 반환'
  })
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
  getOne(@Param('id') id: string) {
    const parsedId = isNaN(Number(id)) ? id : Number(id);
    return this.newsletterService.findById(parsedId);
  }

  @ApiOperation({ summary: '수신 여부 토글 (Y/N)' })
  @ApiResponse({ status: 200, description: '토글 성공' })
  @Patch(':id/toggle')
  toggleSubscription(@Param('id') id: string) {
    const parsedId = isNaN(Number(id)) ? id : Number(id);
    return this.newsletterService.toggleSubscription(parsedId);
  }

  @ApiOperation({ summary: '구독자 다중 삭제' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @Delete('bulk')
  deleteMany(@Body() dto: AdminDeleteManyDto) {
    return this.newsletterService.deleteMany(dto.ids);
  }

  @ApiOperation({ summary: '구독자 삭제' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @Delete(':id')
  delete(@Param('id') id: string) {
    const parsedId = isNaN(Number(id)) ? id : Number(id);
    return this.newsletterService.delete(parsedId);
  }

  @ApiOperation({ summary: '뉴스레터 발송' })
  @ApiBody({
    description: '뉴스레터 발송 요청',
    schema: {
      type: 'object',
      properties: {
        subject: { type: 'string', description: '제목' },
        html: { type: 'string', description: 'HTML 본문' },
        target: {
          type: 'string',
          enum: ['ALL', 'MEMBERS', 'SUBSCRIBERS'],
          default: 'ALL',
          description: '발송 대상 (기본: ALL)',
        },
      },
      required: ['subject', 'html'],
    },
  })
  @ApiResponse({ status: 200, description: '발송 요청 완료 (배치 전송)' })
  @Post('send')
  send(@Body() body: { subject: string; html: string; target?: 'ALL' | 'MEMBERS' | 'SUBSCRIBERS' }) {
    return this.newsletterService.sendNewsletter({
      subject: body.subject,
      html: body.html,
      target: body.target || 'ALL',
    });
  }


}

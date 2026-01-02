import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Delete,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { AdminBaseController } from './admin-base.controller';
import { InsightsService } from 'src/components/content/services/insights.service';

@ApiTags('Admin Comments')
@Controller('admin/comments')
export class AdminCommentsController extends AdminBaseController {
  constructor(
    private readonly insightsService: InsightsService,
  ) {
    super();
  }

  @ApiOperation({ summary: '신고된 댓글 목록 조회 (Insights 댓글만)' })
  @ApiResponse({ status: 200, description: '신고된 댓글 목록 조회 성공' })
  @ApiQuery({ name: 'category', required: false, type: Number, description: '인사이트 카테고리 ID 필터 (기본: all - 모든 카테고리)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: '페이지 번호 (기본: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20, description: '페이지당 항목 수 (기본: 20)' })
  @Get('reported')
  async getReportedComments(
    @Query('category') category?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const categoryId = category ? Number(category) : undefined;

    const result = await this.insightsService.getReportedComments({
      categoryId,
      page: pageNum,
      limit: limitNum,
    });

    return {
      ...result,
      category: categoryId !== undefined ? String(categoryId) : 'all',
    };
  }

  @ApiOperation({ summary: '신고된 댓글 상세 조회' })
  @ApiResponse({ status: 200, description: '댓글 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '댓글을 찾을 수 없습니다' })
  @ApiParam({ name: 'id', type: Number, description: '댓글 ID' })
  @Get('reported/:id')
  async getReportedCommentDetail(@Param('id', ParseIntPipe) id: number) {
    const result = await this.insightsService.getCommentById(id);
    return {
      ...result,
      comment: {
        ...result.comment,
        createdAtFormatted: this.formatDateTime(result.comment.createdAt),
      },
    };
  }

  @ApiOperation({ summary: '댓글 숨김/노출 토글' })
  @ApiResponse({ status: 200, description: '댓글 숨김/노출 토글 성공' })
  @ApiResponse({ status: 404, description: '댓글을 찾을 수 없습니다' })
  @ApiParam({ name: 'id', type: Number, description: '댓글 ID' })
  @Patch(':id/hide')
  async toggleCommentVisibility(@Param('id', ParseIntPipe) id: number) {
    return this.insightsService.toggleCommentVisibility(id);
  }

  @ApiOperation({ summary: '댓글 삭제' })
  @ApiResponse({ status: 200, description: '댓글 삭제 성공' })
  @ApiResponse({ status: 404, description: '댓글을 찾을 수 없습니다' })
  @ApiParam({ name: 'id', type: Number, description: '댓글 ID' })
  @Delete(':id')
  async deleteComment(@Param('id', ParseIntPipe) id: number) {
    return this.insightsService.adminDeleteComment(id);
  }

  // 날짜 포맷 헬퍼 (yyyy.MM.dd HH:mm)
  private formatDateTime(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  }
}






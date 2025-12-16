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
import { AdminJwtAuthGuard } from '../admin-jwt.guard';
import { DataRoomService } from 'src/components/content/services/data-room.service';
import { ColumnService } from 'src/components/content/services/column.service';

@ApiTags('Admin Comments')
@ApiBearerAuth('admin-auth')
@Controller('admin/comments')
@UseGuards(AdminJwtAuthGuard)
export class AdminCommentsController {
  constructor(
    private readonly dataRoomService: DataRoomService,
    private readonly columnService: ColumnService,
  ) {}

  @ApiOperation({ summary: '신고된 댓글 목록 조회' })
  @ApiResponse({ status: 200, description: '신고된 댓글 목록 조회 성공' })
  @ApiQuery({ name: 'type', required: false, enum: ['data-room', 'column', 'all'], description: '댓글 유형 필터 (기본: all)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @Get('reported')
  async getReportedComments(
    @Query('type') type?: 'data-room' | 'column' | 'all',
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const commentType = type || 'all';

    if (commentType === 'data-room') {
      const result = await this.dataRoomService.findReportedComments(pageNum, limitNum);
      return {
        type: 'data-room',
        ...result,
      };
    } else if (commentType === 'column') {
      const result = await this.columnService.findReportedComments(pageNum, limitNum);
      return {
        type: 'column',
        ...result,
      };
    } else {
      // Combine both types
      const [dataRoomComments, columnComments] = await Promise.all([
        this.dataRoomService.findReportedComments(pageNum, limitNum),
        this.columnService.findReportedComments(pageNum, limitNum),
      ]);

      // Merge and sort by createdAt (latest first)
      const allComments = [
        ...dataRoomComments.items.map((item) => ({
          ...item,
          commentType: 'data-room' as const,
        })),
        ...columnComments.items.map((item) => ({
          ...item,
          commentType: 'column' as const,
        })),
      ].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Latest first
      });

      // Apply pagination to merged results
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedComments = allComments.slice(startIndex, endIndex);

      return {
        type: 'all',
        items: paginatedComments,
        total: dataRoomComments.total + columnComments.total,
        page: pageNum,
        limit: limitNum,
        summary: {
          dataRoomTotal: dataRoomComments.total,
          columnTotal: columnComments.total,
        },
      };
    }
  }

  @ApiOperation({ summary: '신고된 댓글 상세 조회' })
  @ApiResponse({ status: 200, description: '댓글 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '댓글을 찾을 수 없습니다' })
  @ApiParam({ name: 'type', enum: ['data-room', 'column'], description: '댓글 유형' })
  @ApiParam({ name: 'id', type: Number, description: '댓글 ID' })
  @Get('reported/:type/:id')
  async getReportedCommentDetail(
    @Param('type') type: 'data-room' | 'column',
    @Param('id', ParseIntPipe) id: number,
  ) {
    let comment: any;
    let contentInfo: any;

    if (type === 'data-room') {
      comment = await this.dataRoomService.findCommentById(id);
      if (!comment) {
        throw new NotFoundException('댓글을 찾을 수 없습니다.');
      }

      const content = comment.content;
      contentInfo = {
        id: content.id,
        name: content.name,
        imageUrl: content.imageUrl,
        categoryName: content.categoryName,
        body: content.body,
        displayBodyHtml: content.displayBodyHtml,
        displayBodyHtmlLabel: content.displayBodyHtml ? 'Y' : 'N',
        hasComments: content.comments && content.comments.length > 0,
        hasCommentsLabel: content.comments && content.comments.length > 0 ? 'Y' : 'N',
        isExposed: content.isExposed,
        exposedLabel: content.isExposed ? 'Y' : 'N',
        dataRoom: content.dataRoom ? {
          id: content.dataRoom.id,
          name: content.dataRoom.name,
          boardType: content.dataRoom.boardType,
        } : null,
      };
    } else if (type === 'column') {
      comment = await this.columnService.findCommentById(id);
      if (!comment) {
        throw new NotFoundException('댓글을 찾을 수 없습니다.');
      }

      const column = comment.column;
      contentInfo = {
        id: column.id,
        name: column.name,
        imageUrl: column.thumbnailUrl,
        categoryName: column.categoryName,
        body: column.body,
        displayBodyHtml: true, // Column always has body
        displayBodyHtmlLabel: 'Y',
        hasComments: column.comments && column.comments.length > 0,
        hasCommentsLabel: column.comments && column.comments.length > 0 ? 'Y' : 'N',
        isExposed: column.isExposed,
        exposedLabel: column.isExposed ? 'Y' : 'N',
      };
    } else {
      throw new NotFoundException('잘못된 댓글 유형입니다.');
    }

    return {
      comment: {
        id: comment.id,
        body: comment.body,
        authorName: comment.authorName || '-',
        memberId: comment.memberId,
        isReported: comment.isReported,
        isHidden: comment.isHidden,
        isHiddenLabel: comment.isHidden ? 'Y' : 'N',
        createdAt: comment.createdAt,
        createdAtFormatted: this.formatDateTime(comment.createdAt),
      },
      content: contentInfo,
      commentType: type,
    };
  }

  @ApiOperation({ summary: '댓글 숨김/노출 토글' })
  @ApiResponse({ status: 200, description: '댓글 숨김/노출 토글 성공' })
  @ApiResponse({ status: 404, description: '댓글을 찾을 수 없습니다' })
  @ApiParam({ name: 'type', enum: ['data-room', 'column'], description: '댓글 유형' })
  @ApiParam({ name: 'id', type: Number, description: '댓글 ID' })
  @Patch(':type/:id/hide')
  async toggleCommentVisibility(
    @Param('type') type: 'data-room' | 'column',
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (type === 'data-room') {
      return this.dataRoomService.toggleCommentVisibility(id);
    } else if (type === 'column') {
      return this.columnService.toggleCommentVisibility(id);
    } else {
      throw new NotFoundException('잘못된 댓글 유형입니다.');
    }
  }

  @ApiOperation({ summary: '댓글 삭제' })
  @ApiResponse({ status: 200, description: '댓글 삭제 성공' })
  @ApiResponse({ status: 404, description: '댓글을 찾을 수 없습니다' })
  @ApiParam({ name: 'type', enum: ['data-room', 'column'], description: '댓글 유형' })
  @ApiParam({ name: 'id', type: Number, description: '댓글 ID' })
  @Delete(':type/:id')
  async deleteComment(
    @Param('type') type: 'data-room' | 'column',
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (type === 'data-room') {
      return this.dataRoomService.deleteComment(id);
    } else if (type === 'column') {
      return this.columnService.deleteComment(id);
    } else {
      throw new NotFoundException('잘못된 댓글 유형입니다.');
    }
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





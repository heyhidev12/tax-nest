import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { MembersService } from 'src/components/members/members.service';
import { AdminBaseController } from './admin-base.controller';
import { AdminMemberQueryDto } from 'src/libs/dto/admin/admin-member-query.dto';
import { AdminCreateMemberDto } from 'src/libs/dto/admin/admin-create-member.dto';
import { AdminDeleteManyDto } from 'src/libs/dto/admin/admin-delete-many.dto';
import { MemberStatus } from 'src/libs/enums/members.enum';
import { AdminUpdateMemberDto } from 'src/libs/dto/admin/admin-update-member.dto';

@ApiTags('Admin Members')
@Controller('admin/members')
export class AdminMembersController extends AdminBaseController {
  constructor(private readonly membersService: MembersService) {
    super();
  }

  @ApiOperation({ summary: '회원 목록 조회' })
  @ApiResponse({ status: 200, description: '목록 조회 성공 (검색: 이름/전화번호, 필터: 회원유형/상태/승인여부, 정렬: 최신순/오래된순)' })
  @Get()
  list(@Query() query: AdminMemberQueryDto) {
    return this.membersService.adminList(query);
  }

  @ApiOperation({ summary: '보험사 승인 대기 목록' })
  @ApiResponse({ status: 200, description: '보험사 회원 승인 대기 목록 (기본: 미승인 상태)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'sort', required: false, example: 'latest', enum: ['latest', 'oldest'] })
  @Get('pending-approval')
  pendingApprovalList(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('sort') sort: 'latest' | 'oldest' = 'latest',
  ) {
    return this.membersService.adminPendingApprovalList(Number(page), Number(limit), sort);
  }

  @ApiOperation({ summary: '회원 추가' })
  @ApiResponse({ status: 201, description: '회원 추가 성공' })
  @ApiResponse({ status: 400, description: '이미 사용 중인 ID' })
  @Post()
  create(@Body() dto: AdminCreateMemberDto) {
    return this.membersService.adminCreate(dto);
  }

  @ApiOperation({ summary: '회원 정보 수정' })
  @ApiResponse({ status: 200, description: '회원 정보 수정 성공' })
  @ApiResponse({ status: 404, description: '회원 없음' })
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminUpdateMemberDto,
  ) {
    return this.membersService.adminUpdate(id, dto);
  }

  @ApiOperation({ summary: '회원 상세 조회' })
  @ApiResponse({ status: 200, description: '상세 조회 성공 (상담 신청 수 포함)' })
  @ApiResponse({ status: 404, description: '회원 없음' })
  @Get(':id')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.membersService.adminGetOne(id);
  }

  @ApiOperation({ summary: '회원 승인 (보험사)' })
  @ApiResponse({ status: 200, description: '승인 성공' })
  @Patch(':id/approve')
  approve(@Param('id', ParseIntPipe) id: number) {
    return this.membersService.adminApprove(id);
  }

  @ApiOperation({ summary: '회원 승인 취소 (보험사)' })
  @ApiResponse({ status: 200, description: '승인 취소 성공' })
  @Patch(':id/reject-approval')
  rejectApproval(@Param('id', ParseIntPipe) id: number) {
    return this.membersService.adminRejectApproval(id);
  }

  @ApiOperation({ summary: '회원 상태 변경 (이용중/탈퇴)' })
  @ApiBody({
    description: '회원 상태 변경 정보',
    schema: {
      type: 'object',
      required: ['status'],
      properties: {
        status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'], description: '회원 상태 (필수)' },
      },
    },
  })
  @ApiResponse({ status: 200, description: '상태 변경 성공' })
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: MemberStatus },
  ) {
    return this.membersService.adminUpdateStatus(id, body.status);
  }

  @ApiOperation({ summary: '회원 다중 삭제 (체크박스 선택 후 삭제)' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @Delete()
  deleteMany(@Body() dto: AdminDeleteManyDto) {
    return this.membersService.adminDeleteMany(dto.ids);
  }

  @ApiOperation({ summary: '회원 단일 삭제' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @Delete(':id')
  deleteOne(@Param('id', ParseIntPipe) id: number) {
    return this.membersService.adminDeleteMany([id]);
  }
}

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
import { MembersService } from 'src/components/members/members.service';
import { AdminJwtAuthGuard } from '../admin-jwt.guard';
import { AdminMemberQueryDto } from 'src/libs/dto/admin/admin-member-query.dto';
import { AdminDeleteManyDto } from 'src/libs/dto/admin/admin-delete-many.dto';
import { MemberStatus } from 'src/libs/enums/members.enum';

@ApiTags('Admin Members')
@ApiBearerAuth('admin-auth')
@Controller('admin/members')
@UseGuards(AdminJwtAuthGuard)
export class AdminMembersController {
  constructor(private readonly membersService: MembersService) {}

  @ApiOperation({ summary: '회원 목록 조회' })
  @ApiResponse({ status: 200, description: '목록 조회 성공' })
  @Get()
  list(@Query() query: AdminMemberQueryDto) {
    return this.membersService.adminList(query);
  }

  @ApiOperation({ summary: '보험사 승인 대기 목록' })
  @ApiResponse({ status: 200, description: '목록 조회 성공' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @Get('pending-approval')
  pendingApprovalList(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.membersService.adminPendingApprovalList(Number(page), Number(limit));
  }

  @ApiOperation({ summary: '회원 상세 조회' })
  @ApiResponse({ status: 200, description: '상세 조회 성공' })
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

  @ApiOperation({ summary: '회원 상태 변경' })
  @ApiResponse({ status: 200, description: '상태 변경 성공' })
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: MemberStatus },
  ) {
    return this.membersService.adminUpdateStatus(id, body.status);
  }

  @ApiOperation({ summary: '회원 다중 삭제' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @Delete('bulk')
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


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
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { AdminAuthService } from '../admin-auth.service';
import { AdminBaseController } from './admin-base.controller';
import { CreateAdminDto } from 'src/libs/dto/admin/create-admin.dto';
import { Roles } from '../decorators/roles.decorator';
import { AdminRole } from 'src/libs/enums/admin.enum';
import { RolesGuard } from '../roles.guard';

@ApiTags('Admin Settings')
@Controller('admin/settings')
@UseGuards(RolesGuard)
export class AdminSettingsController extends AdminBaseController {
  constructor(private readonly adminAuthService: AdminAuthService) {
    super();
  }

  // ===== SUPER_ADMIN ONLY ENDPOINTS =====
  // These endpoints manage admin accounts and should remain restricted to SUPER_ADMIN only

  @ApiOperation({ summary: '관리자 목록 조회 (SUPER_ADMIN only)' })
  @ApiResponse({ status: 200, description: '목록 조회 성공' })
  @ApiResponse({ status: 403, description: '권한 없음 - SUPER_ADMIN만 접근 가능' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @Get('admins')
  @Roles(AdminRole.SUPER_ADMIN)
  listAdmins(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.adminAuthService.list(Number(page), Number(limit));
  }

  @ApiOperation({ summary: '관리자 추가 (SUPER_ADMIN only)' })
  @ApiResponse({ status: 201, description: '관리자 추가 성공' })
  @ApiResponse({ status: 400, description: '이미 사용 중인 아이디입니다.' })
  @ApiResponse({ status: 403, description: '권한 없음 - SUPER_ADMIN만 접근 가능' })
  @Post('admins')
  @Roles(AdminRole.SUPER_ADMIN)
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.adminAuthService.create(dto);
  }

  @ApiOperation({ summary: '관리자 삭제 (SUPER_ADMIN only)', description: 'SUPER_ADMIN은 자신의 계정을 삭제할 수 없습니다.' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 400, description: '자신의 계정은 삭제할 수 없습니다.' })
  @ApiResponse({ status: 403, description: '권한 없음 - SUPER_ADMIN만 접근 가능' })
  @Delete('admins/:id')
  @Roles(AdminRole.SUPER_ADMIN)
  deleteAdmin(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const currentAdminId = req.user.id;
    return this.adminAuthService.delete(id, currentAdminId);
  }

  @ApiOperation({ summary: '관리자 활성화/비활성화 (SUPER_ADMIN only)', description: '현재 로그인한 SUPER_ADMIN은 자신의 계정을 비활성화할 수 없습니다.' })
  @ApiResponse({ status: 200, description: '토글 성공' })
  @ApiResponse({ status: 400, description: '현재 로그인한 최고관리자 계정은 비활성화할 수 없습니다.' })
  @ApiResponse({ status: 403, description: '권한 없음 - SUPER_ADMIN만 접근 가능' })
  @Patch('admins/:id/toggle-active')
  @Roles(AdminRole.SUPER_ADMIN)
  toggleActive(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const currentAdminId = req.user.id;
    return this.adminAuthService.toggleActive(id, currentAdminId);
  }

  @ApiOperation({ summary: '관리자 권한 수정 (SUPER_ADMIN only)' })
  @ApiBody({
    description: '관리자 권한 수정 정보',
    schema: {
      type: 'object',
      required: ['permissions'],
      properties: {
        permissions: {
          type: 'object',
          additionalProperties: { type: 'boolean' },
          description: '권한 객체 (필수, 예: { "content": true, "members": false })'
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: '권한 수정 성공' })
  @ApiResponse({ status: 403, description: '권한 없음 - SUPER_ADMIN만 접근 가능' })
  @Patch('admins/:id/permissions')
  @Roles(AdminRole.SUPER_ADMIN)
  updatePermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { permissions: Record<string, boolean> },
  ) {
    return this.adminAuthService.updatePermissions(id, body.permissions);
  }
}


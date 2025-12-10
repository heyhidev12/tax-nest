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
import { AdminAuthService } from '../admin-auth.service';
import { AdminJwtAuthGuard } from '../admin-jwt.guard';
import { CreateAdminDto } from 'src/libs/dto/admin/create-admin.dto';
import { Roles } from '../decorators/roles.decorator';
import { AdminRole } from 'src/libs/enums/admin.enum';
import { RolesGuard } from '../roles.guard';

@ApiTags('Admin Settings')
@ApiBearerAuth('admin-auth')
@Controller('admin/settings')
@UseGuards(AdminJwtAuthGuard, RolesGuard)
export class AdminSettingsController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @ApiOperation({ summary: '관리자 목록 조회 (SUPER_ADMIN)' })
  @ApiResponse({ status: 200, description: '목록 조회 성공' })
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

  @ApiOperation({ summary: '관리자 추가 (SUPER_ADMIN)' })
  @ApiResponse({ status: 201, description: '관리자 추가 성공' })
  @ApiResponse({ status: 400, description: '이미 사용 중인 ID' })
  @Post('admins')
  @Roles(AdminRole.SUPER_ADMIN)
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.adminAuthService.create(dto);
  }

  @ApiOperation({ summary: '관리자 삭제 (SUPER_ADMIN)' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @Delete('admins/:id')
  @Roles(AdminRole.SUPER_ADMIN)
  deleteAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.adminAuthService.delete(id);
  }

  @ApiOperation({ summary: '관리자 활성화/비활성화 (SUPER_ADMIN)' })
  @ApiResponse({ status: 200, description: '토글 성공' })
  @Patch('admins/:id/toggle-active')
  @Roles(AdminRole.SUPER_ADMIN)
  toggleActive(@Param('id', ParseIntPipe) id: number) {
    return this.adminAuthService.toggleActive(id);
  }

  @ApiOperation({ summary: '관리자 권한 수정 (SUPER_ADMIN)' })
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
  @Patch('admins/:id/permissions')
  @Roles(AdminRole.SUPER_ADMIN)
  updatePermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { permissions: Record<string, boolean> },
  ) {
    return this.adminAuthService.updatePermissions(id, body.permissions);
  }
}


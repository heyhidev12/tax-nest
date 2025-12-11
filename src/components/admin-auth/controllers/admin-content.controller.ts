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
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { AdminJwtAuthGuard } from '../admin-jwt.guard';
import { MainBannerService } from 'src/components/content/services/main-banner.service';
import { HistoryService } from 'src/components/content/services/history.service';
import { AwardService } from 'src/components/content/services/award.service';
import { BranchService } from 'src/components/content/services/branch.service';
import { KeyCustomerService } from 'src/components/content/services/key-customer.service';
import { BusinessAreaService } from 'src/components/content/services/business-area.service';
import { TrainingSeminarService } from 'src/components/content/services/training-seminar.service';
import { ColumnService } from 'src/components/content/services/column.service';
import { DataRoomService } from 'src/components/content/services/data-room.service';
import { CategoryService } from 'src/components/content/services/category.service';
import { TaxMemberService } from 'src/components/content/services/tax-member.service';
import { ExposureSettingsService } from 'src/components/content/services/exposure-settings.service';
import { AdminDeleteManyDto } from 'src/libs/dto/admin/admin-delete-many.dto';
import { AdminTaxMemberQueryDto } from 'src/libs/dto/admin/admin-tax-member-query.dto';
import { AdminCreateTaxMemberDto } from 'src/libs/dto/admin/admin-create-tax-member.dto';
import { AdminUpdateTaxMemberDto } from 'src/libs/dto/admin/admin-update-tax-member.dto';
import { AdminTrainingSeminarQueryDto } from 'src/libs/dto/admin/admin-training-seminar-query.dto';
import { AdminCreateTrainingSeminarDto } from 'src/libs/dto/admin/admin-create-training-seminar.dto';
import { AdminUpdateTrainingSeminarDto } from 'src/libs/dto/admin/admin-update-training-seminar.dto';
import { ApplicationStatus } from 'src/libs/entity/training-seminar.entity';

@ApiTags('Admin Content')
@ApiBearerAuth('admin-auth')
@Controller('admin/content')
@UseGuards(AdminJwtAuthGuard)
export class AdminContentController {
  constructor(
    private readonly bannerService: MainBannerService,
    private readonly historyService: HistoryService,
    private readonly awardService: AwardService,
    private readonly branchService: BranchService,
    private readonly keyCustomerService: KeyCustomerService,
    private readonly businessAreaService: BusinessAreaService,
    private readonly trainingSeminarService: TrainingSeminarService,
    private readonly columnService: ColumnService,
    private readonly dataRoomService: DataRoomService,
    private readonly categoryService: CategoryService,
    private readonly taxMemberService: TaxMemberService,
    private readonly exposureSettingsService: ExposureSettingsService,
  ) {}

  // ===== MAIN BANNER =====
  @ApiOperation({ summary: '메인 배너 목록' })
  @Get('banners')
  listBanners() {
    return this.bannerService.findAll(true);
  }

  @ApiOperation({ summary: '메인 배너 생성' })
  @ApiBody({
    description: '메인 배너 생성 정보',
    schema: {
      type: 'object',
      required: ['mediaType', 'mediaUrl'],
      properties: {
        mediaType: { type: 'string', enum: ['IMAGE', 'VIDEO'], description: '미디어 타입 (필수)' },
        mediaUrl: { type: 'string', description: '미디어 URL (필수)' },
        linkUrl: { type: 'string', description: '링크 URL (선택)' },
        displayOrder: { type: 'number', description: '표시 순서 (기본: 0)' },
        isActive: { type: 'boolean', description: '활성화 여부 (기본: true)' },
      },
    },
  })
  @Post('banners')
  createBanner(@Body() body: any) {
    return this.bannerService.create(body);
  }

  @ApiOperation({ summary: '메인 배너 수정' })
  @ApiBody({
    description: '메인 배너 수정 정보',
    schema: {
      type: 'object',
      properties: {
        mediaType: { type: 'string', enum: ['IMAGE', 'VIDEO'], description: '미디어 타입' },
        mediaUrl: { type: 'string', description: '미디어 URL' },
        linkUrl: { type: 'string', description: '링크 URL' },
        displayOrder: { type: 'number', description: '표시 순서' },
        isActive: { type: 'boolean', description: '활성화 여부' },
      },
    },
  })
  @Patch('banners/:id')
  updateBanner(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.bannerService.update(id, body);
  }

  @ApiOperation({ summary: '메인 배너 삭제' })
  @Delete('banners/:id')
  deleteBanner(@Param('id', ParseIntPipe) id: number) {
    return this.bannerService.delete(id);
  }

  @ApiOperation({ summary: '메인 배너 다중 삭제' })
  @Delete('banners/bulk')
  deleteBanners(@Body() dto: AdminDeleteManyDto) {
    return this.bannerService.deleteMany(dto.ids);
  }

  @ApiOperation({ summary: '메인 배너 순서 변경' })
  @ApiBody({
    description: '메인 배너 순서 변경 정보',
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              displayOrder: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @Patch('banners/order')
  updateBannerOrder(@Body() body: { items: { id: number; displayOrder: number }[] }) {
    return this.bannerService.updateOrder(body.items);
  }

  // ===== HISTORY =====
  @ApiOperation({ summary: '연혁 연도 목록' })
  @Get('history/years')
  listHistoryYears(@Query() query: any) {
    return this.historyService.findAllYears({ ...query, includeHidden: true });
  }

  @ApiOperation({ summary: '연혁 연도 상세 (항목 포함)' })
  @Get('history/years/:id')
  getHistoryYear(@Param('id', ParseIntPipe) id: number) {
    return this.historyService.findYearById(id);
  }

  @ApiOperation({ summary: '연혁 연도 생성' })
  @ApiBody({
    description: '연혁 연도 생성 정보',
    schema: {
      type: 'object',
      required: ['year'],
      properties: {
        year: { type: 'number' },
        isExposed: { type: 'boolean' },
      },
    },
  })
  @Post('history/years')
  createHistoryYear(@Body() body: { year: number; isExposed?: boolean }) {
    return this.historyService.createYear(body.year, body.isExposed);
  }

  @ApiOperation({ summary: '연혁 연도 수정' })
  @ApiBody({
    description: '연혁 연도 수정 정보',
    schema: {
      type: 'object',
      properties: {
        year: { type: 'number', description: '연도' },
        isExposed: { type: 'boolean', description: '노출 여부' },
      },
    },
  })
  @Patch('history/years/:id')
  updateHistoryYear(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.historyService.updateYear(id, body);
  }

  @ApiOperation({ summary: '연혁 연도 삭제' })
  @Delete('history/years/:id')
  deleteHistoryYear(@Param('id', ParseIntPipe) id: number) {
    return this.historyService.deleteYear(id);
  }

  @ApiOperation({ summary: '연혁 연도 다중 삭제' })
  @Delete('history/years/bulk')
  deleteHistoryYears(@Body() dto: AdminDeleteManyDto) {
    return this.historyService.deleteYears(dto.ids);
  }

  @ApiOperation({ summary: '연혁 연도 노출 토글' })
  @Patch('history/years/:id/toggle-exposure')
  toggleHistoryYearExposure(@Param('id', ParseIntPipe) id: number) {
    return this.historyService.toggleYearExposure(id);
  }

  @ApiOperation({ summary: '연혁 연도 순서 변경' })
  @ApiBody({
    description: '연혁 연도 순서 변경 정보',
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              displayOrder: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @Patch('history/years/order')
  updateHistoryYearOrder(@Body() body: { items: { id: number; displayOrder: number }[] }) {
    return this.historyService.updateYearOrder(body.items);
  }

  @ApiOperation({ summary: '연혁 항목 목록 (연도별)' })
  @Get('history/years/:yearId/items')
  listHistoryItems(@Param('yearId', ParseIntPipe) yearId: number) {
    return this.historyService.findItemsByYear(yearId, true);
  }

  @ApiOperation({ summary: '연혁 항목 생성' })
  @ApiBody({
    description: '연혁 항목 생성 정보',
    schema: {
      type: 'object',
      required: ['content'],
      properties: {
        month: { type: 'number', description: '월 (선택, 1-12)' },
        content: { type: 'string', description: '항목 내용 (필수)' },
        isExposed: { type: 'boolean', description: '노출 여부 (기본: true)' },
      },
    },
  })
  @Post('history/years/:yearId/items')
  createHistoryItem(
    @Param('yearId', ParseIntPipe) yearId: number,
    @Body() body: { month?: number; content: string; isExposed?: boolean },
  ) {
    return this.historyService.createItem(yearId, body);
  }

  @ApiOperation({ summary: '연혁 항목 수정' })
  @ApiBody({
    description: '연혁 항목 수정 정보',
    schema: {
      type: 'object',
      properties: {
        month: { type: 'number', description: '월 (1-12)' },
        content: { type: 'string', description: '항목 내용' },
        isExposed: { type: 'boolean', description: '노출 여부' },
      },
    },
  })
  @Patch('history/items/:id')
  updateHistoryItem(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.historyService.updateItem(id, body);
  }

  @ApiOperation({ summary: '연혁 항목 삭제' })
  @Delete('history/items/:id')
  deleteHistoryItem(@Param('id', ParseIntPipe) id: number) {
    return this.historyService.deleteItem(id);
  }

  @ApiOperation({ summary: '연혁 항목 다중 삭제' })
  @Delete('history/items/bulk')
  deleteHistoryItems(@Body() dto: AdminDeleteManyDto) {
    return this.historyService.deleteItems(dto.ids);
  }

  @ApiOperation({ summary: '연혁 항목 노출 토글' })
  @Patch('history/items/:id/toggle-exposure')
  toggleHistoryItemExposure(@Param('id', ParseIntPipe) id: number) {
    return this.historyService.toggleItemExposure(id);
  }

  @ApiOperation({ summary: '연혁 항목 순서 변경' })
  @ApiBody({
    description: '연혁 항목 순서 변경 정보',
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              displayOrder: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @Patch('history/items/order')
  updateHistoryItemOrder(@Body() body: { items: { id: number; displayOrder: number }[] }) {
    return this.historyService.updateItemOrder(body.items);
  }

  // ===== AWARDS =====
  @ApiOperation({ summary: '수상/인증 연도 목록' })
  @Get('awards/years')
  listAwardYears(@Query() query: any) {
    return this.awardService.findAllYears({ ...query, includeHidden: true });
  }

  @ApiOperation({ summary: '수상/인증 연도 상세 (수상내역 포함)' })
  @Get('awards/years/:id')
  getAwardYear(@Param('id', ParseIntPipe) id: number) {
    return this.awardService.getYearDetail(id);
  }

  @ApiOperation({ summary: '수상/인증 연도 생성' })
  @ApiBody({
    description: '수상/인증 연도 생성 정보',
    schema: {
      type: 'object',
      required: ['yearName'],
      properties: {
        yearName: { type: 'string' },
        isMainExposed: { type: 'boolean' },
        isExposed: { type: 'boolean' },
      },
    },
  })
  @Post('awards/years')
  createAwardYear(@Body() body: { yearName: string; isMainExposed?: boolean; isExposed?: boolean }) {
    return this.awardService.createYear(body.yearName, body.isMainExposed, body.isExposed);
  }

  @ApiOperation({ summary: '수상/인증 연도 수정' })
  @ApiBody({
    description: '수상/인증 연도 수정 정보',
    schema: {
      type: 'object',
      properties: {
        yearName: { type: 'string', description: '연도명' },
        isMainExposed: { type: 'boolean', description: '메인 노출 여부' },
        isExposed: { type: 'boolean', description: '노출 여부' },
      },
    },
  })
  @Patch('awards/years/:id')
  updateAwardYear(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.awardService.updateYear(id, body);
  }

  @ApiOperation({ summary: '수상/인증 연도 삭제' })
  @Delete('awards/years/:id')
  deleteAwardYear(@Param('id', ParseIntPipe) id: number) {
    return this.awardService.deleteYear(id);
  }

  @ApiOperation({ summary: '수상/인증 연도 다중 삭제' })
  @Delete('awards/years/bulk')
  deleteAwardYears(@Body() dto: AdminDeleteManyDto) {
    return this.awardService.deleteYears(dto.ids);
  }

  @ApiOperation({ summary: '수상/인증 연도 노출 토글' })
  @Patch('awards/years/:id/toggle-exposure')
  toggleAwardYearExposure(@Param('id', ParseIntPipe) id: number) {
    return this.awardService.toggleYearExposure(id);
  }

  @ApiOperation({ summary: '수상/인증 연도 메인 노출 토글' })
  @Patch('awards/years/:id/toggle-main-exposure')
  toggleAwardYearMainExposure(@Param('id', ParseIntPipe) id: number) {
    return this.awardService.toggleYearMainExposure(id);
  }

  @ApiOperation({ summary: '수상/인증 연도 순서 변경' })
  @ApiBody({
    description: '수상/인증 연도 순서 변경 정보',
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              displayOrder: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @Patch('awards/years/order')
  updateAwardYearOrder(@Body() body: { items: { id: number; displayOrder: number }[] }) {
    return this.awardService.updateYearOrder(body.items);
  }

  @ApiOperation({ summary: '수상/인증 목록 (연도별)' })
  @Get('awards/years/:yearId/awards')
  listAwards(@Param('yearId', ParseIntPipe) yearId: number) {
    return this.awardService.findAwardsByYear(yearId, { includeHidden: true });
  }

  @ApiOperation({ summary: '수상/인증 상세' })
  @Get('awards/:id')
  getAward(@Param('id', ParseIntPipe) id: number) {
    return this.awardService.findAwardById(id);
  }

  @ApiOperation({ summary: '수상/인증 생성' })
  @ApiBody({
    description: '수상/인증 생성 정보',
    schema: {
      type: 'object',
      required: ['name', 'source', 'imageUrl'],
      properties: {
        name: { type: 'string', description: '수상/인증 명칭 (필수)' },
        source: { type: 'string', description: '출처 (필수)' },
        imageUrl: { type: 'string', description: '이미지 URL (필수)' },
        isMainExposed: { type: 'boolean', description: '메인 노출 여부 (기본: false)' },
        isExposed: { type: 'boolean', description: '노출 여부 (기본: true)' },
      },
    },
  })
  @Post('awards/years/:yearId/awards')
  createAward(
    @Param('yearId', ParseIntPipe) yearId: number,
    @Body() body: { name: string; source: string; imageUrl: string; isMainExposed?: boolean; isExposed?: boolean },
  ) {
    return this.awardService.createAward(yearId, body);
  }

  @ApiOperation({ summary: '수상/인증 수정' })
  @ApiBody({
    description: '수상/인증 수정 정보',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '수상/인증 명칭' },
        source: { type: 'string', description: '출처' },
        imageUrl: { type: 'string', description: '이미지 URL' },
        isMainExposed: { type: 'boolean', description: '메인 노출 여부' },
        isExposed: { type: 'boolean', description: '노출 여부' },
      },
    },
  })
  @Patch('awards/:id')
  updateAward(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.awardService.updateAward(id, body);
  }

  @ApiOperation({ summary: '수상/인증 삭제' })
  @Delete('awards/:id')
  deleteAward(@Param('id', ParseIntPipe) id: number) {
    return this.awardService.deleteAward(id);
  }

  @ApiOperation({ summary: '수상/인증 다중 삭제' })
  @Delete('awards/bulk')
  deleteAwards(@Body() dto: AdminDeleteManyDto) {
    return this.awardService.deleteAwards(dto.ids);
  }

  @ApiOperation({ summary: '수상/인증 노출 토글' })
  @Patch('awards/:id/toggle-exposure')
  toggleAwardExposure(@Param('id', ParseIntPipe) id: number) {
    return this.awardService.toggleAwardExposure(id);
  }

  @ApiOperation({ summary: '수상/인증 메인 노출 토글' })
  @Patch('awards/:id/toggle-main-exposure')
  toggleAwardMainExposure(@Param('id', ParseIntPipe) id: number) {
    return this.awardService.toggleAwardMainExposure(id);
  }

  @ApiOperation({ summary: '수상/인증 순서 변경' })
  @ApiBody({
    description: '수상/인증 순서 변경 정보',
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              displayOrder: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @Patch('awards/order')
  updateAwardOrder(@Body() body: { items: { id: number; displayOrder: number }[] }) {
    return this.awardService.updateAwardOrder(body.items);
  }

  // ===== BRANCHES =====
  @ApiOperation({ summary: '본사/지점 목록' })
  @Get('branches')
  listBranches(@Query() query: any) {
    return this.branchService.findAll({ ...query, includeHidden: true });
  }

  @ApiOperation({ summary: '본사/지점 상세' })
  @Get('branches/:id')
  getBranch(@Param('id', ParseIntPipe) id: number) {
    return this.branchService.findById(id);
  }

  @ApiOperation({ summary: '본사/지점 생성' })
  @ApiBody({
    description: '본사/지점 생성 정보',
    schema: {
      type: 'object',
      required: ['name', 'address'],
      properties: {
        name: { type: 'string', description: '본사/지점 이름 (필수)' },
        address: { type: 'string', description: '상세 주소 (필수)' },
        phoneNumber: { type: 'string', description: '전화번호 (선택)' },
        fax: { type: 'string', description: '팩스 (선택)' },
        email: { type: 'string', description: '이메일 (선택)' },
        blogUrl: { type: 'string', description: '블로그 URL (선택)' },
        youtubeUrl: { type: 'string', description: 'YouTube URL (선택)' },
        instagramUrl: { type: 'string', description: 'Instagram URL (선택)' },
        websiteUrl: { type: 'string', description: 'Website URL (선택)' },
        busInfo: { type: 'string', description: '버스 이용 방법 (선택)' },
        subwayInfo: { type: 'string', description: '지하철 이용 방법 (선택)' },
        taxiInfo: { type: 'string', description: '택시 이용 방법 (선택)' },
        displayOrder: { type: 'number', description: '표시 순서 (기본: 0)' },
        isExposed: { type: 'boolean', description: '노출 여부 (기본: true)' },
      },
    },
  })
  @Post('branches')
  createBranch(@Body() body: any) {
    return this.branchService.create(body);
  }

  @ApiOperation({ summary: '본사/지점 수정' })
  @ApiBody({
    description: '본사/지점 수정 정보',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '본사/지점 이름' },
        address: { type: 'string', description: '상세 주소' },
        phoneNumber: { type: 'string', description: '전화번호' },
        fax: { type: 'string', description: '팩스' },
        email: { type: 'string', description: '이메일' },
        blogUrl: { type: 'string', description: '블로그 URL' },
        youtubeUrl: { type: 'string', description: 'YouTube URL' },
        instagramUrl: { type: 'string', description: 'Instagram URL' },
        websiteUrl: { type: 'string', description: 'Website URL' },
        busInfo: { type: 'string', description: '버스 이용 방법' },
        subwayInfo: { type: 'string', description: '지하철 이용 방법' },
        taxiInfo: { type: 'string', description: '택시 이용 방법' },
        displayOrder: { type: 'number', description: '표시 순서' },
        isExposed: { type: 'boolean', description: '노출 여부' },
      },
    },
  })
  @Patch('branches/:id')
  updateBranch(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.branchService.update(id, body);
  }

  @ApiOperation({ summary: '본사/지점 삭제' })
  @Delete('branches/:id')
  deleteBranch(@Param('id', ParseIntPipe) id: number) {
    return this.branchService.delete(id);
  }

  @ApiOperation({ summary: '본사/지점 다중 삭제' })
  @Delete('branches/bulk')
  deleteBranches(@Body() dto: AdminDeleteManyDto) {
    return this.branchService.deleteMany(dto.ids);
  }

  @ApiOperation({ summary: '본사/지점 노출 토글' })
  @Patch('branches/:id/toggle-exposure')
  toggleBranchExposure(@Param('id', ParseIntPipe) id: number) {
    return this.branchService.toggleExposure(id);
  }

  @ApiOperation({ summary: '본사/지점 순서 변경' })
  @ApiBody({
    description: '본사/지점 순서 변경 정보',
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              displayOrder: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @Patch('branches/order')
  updateBranchOrder(@Body() body: { items: { id: number; displayOrder: number }[] }) {
    return this.branchService.updateOrder(body.items);
  }

  // ===== KEY CUSTOMERS =====
  @ApiOperation({ summary: '주요 고객 목록' })
  @Get('key-customers')
  listKeyCustomers(@Query() query: any) {
    return this.keyCustomerService.findAll({ ...query, includeHidden: true });
  }

  @ApiOperation({ summary: '주요 고객 상세' })
  @Get('key-customers/:id')
  getKeyCustomer(@Param('id', ParseIntPipe) id: number) {
    return this.keyCustomerService.findById(id);
  }

  @ApiOperation({ summary: '주요 고객 생성' })
  @ApiBody({
    description: '주요 고객 생성 정보',
    schema: {
      type: 'object',
      required: ['logoUrl'],
      properties: {
        logoUrl: { type: 'string', description: '로고 이미지 URL (필수)' },
        name: { type: 'string', description: '고객사 이름 (선택, 내부 관리용)' },
        displayOrder: { type: 'number', description: '표시 순서 (기본: 0)' },
        isMainExposed: { type: 'boolean', description: '메인 노출 여부 (기본: false)' },
        isExposed: { type: 'boolean', description: '노출 여부 (기본: true)' },
      },
    },
  })
  @Post('key-customers')
  createKeyCustomer(@Body() body: any) {
    return this.keyCustomerService.create(body);
  }

  @ApiOperation({ summary: '주요 고객 수정' })
  @ApiBody({
    description: '주요 고객 수정 정보',
    schema: {
      type: 'object',
      properties: {
        logoUrl: { type: 'string', description: '로고 이미지 URL' },
        name: { type: 'string', description: '고객사 이름 (내부 관리용)' },
        displayOrder: { type: 'number', description: '표시 순서' },
        isMainExposed: { type: 'boolean', description: '메인 노출 여부' },
        isExposed: { type: 'boolean', description: '노출 여부' },
      },
    },
  })
  @Patch('key-customers/:id')
  updateKeyCustomer(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.keyCustomerService.update(id, body);
  }

  @ApiOperation({ summary: '주요 고객 삭제' })
  @Delete('key-customers/:id')
  deleteKeyCustomer(@Param('id', ParseIntPipe) id: number) {
    return this.keyCustomerService.delete(id);
  }

  @ApiOperation({ summary: '주요 고객 다중 삭제' })
  @Delete('key-customers/bulk')
  deleteKeyCustomers(@Body() dto: AdminDeleteManyDto) {
    return this.keyCustomerService.deleteMany(dto.ids);
  }

  @ApiOperation({ summary: '주요 고객 노출 토글' })
  @Patch('key-customers/:id/toggle-exposure')
  toggleKeyCustomerExposure(@Param('id', ParseIntPipe) id: number) {
    return this.keyCustomerService.toggleExposure(id);
  }

  @ApiOperation({ summary: '주요 고객 메인 노출 토글' })
  @Patch('key-customers/:id/toggle-main-exposure')
  toggleKeyCustomerMainExposure(@Param('id', ParseIntPipe) id: number) {
    return this.keyCustomerService.toggleMainExposure(id);
  }

  @ApiOperation({ summary: '주요 고객 순서 변경' })
  @ApiBody({
    description: '주요 고객 순서 변경 정보',
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              displayOrder: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @Patch('key-customers/order')
  updateKeyCustomerOrder(@Body() body: { items: { id: number; displayOrder: number }[] }) {
    return this.keyCustomerService.updateOrder(body.items);
  }

  // ===== BUSINESS AREAS =====
  @ApiOperation({ summary: '업무분야 목록 (검색: 업무분야명, 필터: 콘텐츠타입/대분류/노출여부/메인노출)' })
  @Get('business-areas')
  listBusinessAreas(@Query() query: any) {
    return this.businessAreaService.findAll({ ...query, includeHidden: true });
  }

  @ApiOperation({ summary: '업무분야 대분류 카테고리 목록 (드롭다운용)' })
  @Get('business-areas/categories/major')
  getBusinessAreaMajorCategories() {
    return this.businessAreaService.getMajorCategories();
  }

  @ApiOperation({ summary: '업무분야 중분류 카테고리 목록 (드롭다운용)' })
  @Get('business-areas/categories/minor')
  getBusinessAreaMinorCategories(@Query('majorCategory') majorCategory: string) {
    return this.businessAreaService.getMinorCategories(majorCategory);
  }

  @ApiOperation({ summary: '업무분야 상세' })
  @Get('business-areas/:id')
  getBusinessArea(@Param('id', ParseIntPipe) id: number) {
    return this.businessAreaService.findById(id);
  }

  @ApiOperation({ summary: '업무분야 생성' })
  @ApiBody({
    description: '업무분야 생성 정보',
    schema: {
      type: 'object',
      required: ['contentType', 'name', 'imageUrl', 'majorCategory', 'overview', 'body'],
      properties: {
        contentType: { 
          type: 'string', 
          enum: ['A', 'B', 'C'], 
          description: '콘텐츠 타입 (필수: A, B, C)' 
        },
        name: { type: 'string', description: '업무분야명 (필수)' },
        subDescription: { type: 'string', description: '부제목 (선택)' },
        imageUrl: { type: 'string', description: '대표 이미지 URL (필수)' },
        majorCategory: { type: 'string', description: '대분류 카테고리 (필수)' },
        minorCategory: { type: 'string', description: '중분류 카테고리 (선택)' },
        overview: { type: 'string', description: '개요 (필수, 텍스트)' },
        body: { type: 'string', description: '본문 HTML (필수)' },
        youtubeUrl: { 
          type: 'string', 
          description: 'YouTube URL (선택, 여러 개는 JSON 배열 또는 콤마 구분)' 
        },
        isMainExposed: { type: 'boolean', description: '메인 노출 여부 (기본: false)' },
        isExposed: { type: 'boolean', description: '노출 여부 (기본: true)' },
        displayOrder: { type: 'number', description: '표시 순서 (기본: 0)' },
      },
    },
  })
  @Post('business-areas')
  createBusinessArea(@Body() body: any) {
    return this.businessAreaService.create(body);
  }

  @ApiOperation({ summary: '업무분야 수정' })
  @ApiBody({
    description: '업무분야 수정 정보',
    schema: {
      type: 'object',
      properties: {
        contentType: { 
          type: 'string', 
          enum: ['A', 'B', 'C'], 
          description: '콘텐츠 타입' 
        },
        name: { type: 'string', description: '업무분야명' },
        subDescription: { type: 'string', description: '부제목' },
        imageUrl: { type: 'string', description: '대표 이미지 URL' },
        majorCategory: { type: 'string', description: '대분류 카테고리' },
        minorCategory: { type: 'string', description: '중분류 카테고리' },
        overview: { type: 'string', description: '개요 (텍스트)' },
        body: { type: 'string', description: '본문 HTML' },
        youtubeUrl: { 
          type: 'string', 
          description: 'YouTube URL (여러 개는 JSON 배열 또는 콤마 구분)' 
        },
        isMainExposed: { type: 'boolean', description: '메인 노출 여부' },
        isExposed: { type: 'boolean', description: '노출 여부' },
        displayOrder: { type: 'number', description: '표시 순서' },
      },
    },
  })
  @Patch('business-areas/:id')
  updateBusinessArea(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.businessAreaService.update(id, body);
  }

  @ApiOperation({ summary: '업무분야 삭제' })
  @Delete('business-areas/:id')
  deleteBusinessArea(@Param('id', ParseIntPipe) id: number) {
    return this.businessAreaService.delete(id);
  }

  @ApiOperation({ summary: '업무분야 다중 삭제' })
  @Delete('business-areas/bulk')
  deleteBusinessAreas(@Body() dto: AdminDeleteManyDto) {
    return this.businessAreaService.deleteMany(dto.ids);
  }

  @ApiOperation({ summary: '업무분야 노출 토글' })
  @Patch('business-areas/:id/toggle-exposure')
  toggleBusinessAreaExposure(@Param('id', ParseIntPipe) id: number) {
    return this.businessAreaService.toggleExposure(id);
  }

  @ApiOperation({ summary: '업무분야 메인 노출 토글' })
  @Patch('business-areas/:id/toggle-main-exposure')
  toggleBusinessAreaMainExposure(@Param('id', ParseIntPipe) id: number) {
    return this.businessAreaService.toggleMainExposure(id);
  }

  @ApiOperation({ summary: '업무분야 순서 변경' })
  @ApiBody({
    description: '업무분야 순서 변경 정보',
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              displayOrder: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @Patch('business-areas/order')
  updateBusinessAreaOrder(@Body() body: { items: { id: number; displayOrder: number }[] }) {
    return this.businessAreaService.updateOrder(body.items);
  }

  // ===== TRAINING/SEMINARS =====
  @ApiOperation({ summary: '교육/세미나 목록 조회 (검색: 교육/세미나명, 필터: 유형/모집유형/회원유형/노출여부)' })
  @ApiResponse({ status: 200, description: '목록 조회 성공' })
  @Get('training-seminars')
  listTrainingSeminars(@Query() query: AdminTrainingSeminarQueryDto) {
    return this.trainingSeminarService.findAll({ ...query, includeHidden: true });
  }

  @ApiOperation({ summary: '교육/세미나 상세 조회' })
  @ApiResponse({ status: 200, description: '상세 조회 성공' })
  @ApiResponse({ status: 404, description: '교육/세미나 없음' })
  @Get('training-seminars/:id')
  getTrainingSeminar(@Param('id', ParseIntPipe) id: number) {
    return this.trainingSeminarService.findById(id);
  }

  @ApiOperation({ summary: '교육/세미나 추가' })
  @ApiBody({ type: AdminCreateTrainingSeminarDto, description: '교육/세미나 생성 정보' })
  @ApiResponse({ status: 201, description: '교육/세미나 추가 성공' })
  @ApiResponse({ status: 400, description: '선착순 모집의 경우 정원 필수' })
  @Post('training-seminars')
  createTrainingSeminar(@Body() dto: AdminCreateTrainingSeminarDto) {
    return this.trainingSeminarService.create(dto as any);
  }

  @ApiOperation({ summary: '교육/세미나 수정' })
  @ApiBody({ type: AdminUpdateTrainingSeminarDto, description: '교육/세미나 수정 정보' })
  @ApiResponse({ status: 200, description: '교육/세미나 수정 성공' })
  @ApiResponse({ status: 404, description: '교육/세미나 없음' })
  @ApiResponse({ status: 400, description: '선착순 모집의 경우 정원 필수' })
  @Patch('training-seminars/:id')
  updateTrainingSeminar(@Param('id', ParseIntPipe) id: number, @Body() dto: AdminUpdateTrainingSeminarDto) {
    return this.trainingSeminarService.update(id, dto as any);
  }

  @ApiOperation({ summary: '교육/세미나 삭제' })
  @Delete('training-seminars/:id')
  deleteTrainingSeminar(@Param('id', ParseIntPipe) id: number) {
    return this.trainingSeminarService.delete(id);
  }

  @ApiOperation({ summary: '교육/세미나 다중 삭제' })
  @Delete('training-seminars/bulk')
  deleteTrainingSeminars(@Body() dto: AdminDeleteManyDto) {
    return this.trainingSeminarService.deleteMany(dto.ids);
  }

  @ApiOperation({ summary: '교육/세미나 노출 토글' })
  @Patch('training-seminars/:id/toggle-exposure')
  toggleTrainingSeminarExposure(@Param('id', ParseIntPipe) id: number) {
    return this.trainingSeminarService.toggleExposure(id);
  }

  @ApiOperation({ summary: '교육/세미나 추천 토글' })
  @Patch('training-seminars/:id/toggle-recommended')
  toggleTrainingSeminarRecommended(@Param('id', ParseIntPipe) id: number) {
    return this.trainingSeminarService.toggleRecommended(id);
  }

  @ApiOperation({ summary: '교육/세미나 신청 목록 (검색: 이름)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ApplicationStatus })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @Get('training-seminars/:id/applications')
  listApplications(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: any,
  ) {
    return this.trainingSeminarService.findApplications(id, query);
  }

  @ApiOperation({ summary: '전체 신청 목록 (검색: 이름)' })
  @Get('training-seminar-applications')
  listAllApplications(@Query() query: any) {
    return this.trainingSeminarService.findAllApplications(query);
  }

  @ApiOperation({ summary: '신청 상세' })
  @Get('training-seminar-applications/:id')
  getApplication(@Param('id', ParseIntPipe) id: number) {
    return this.trainingSeminarService.getApplicationById(id);
  }

  @ApiOperation({ summary: '신청 상태 변경' })
  @ApiBody({
    description: '신청 상태 변경 정보',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['WAITING', 'CONFIRMED', 'CANCELLED'] },
      },
    },
  })
  @Patch('training-seminar-applications/:id/status')
  updateApplicationStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: ApplicationStatus },
  ) {
    return this.trainingSeminarService.updateApplicationStatus(id, body.status);
  }

  @ApiOperation({ summary: '신청 삭제' })
  @Delete('training-seminar-applications/:id')
  deleteApplication(@Param('id', ParseIntPipe) id: number) {
    return this.trainingSeminarService.deleteApplication(id);
  }

  @ApiOperation({ summary: '신청 다중 삭제' })
  @Delete('training-seminar-applications/bulk')
  deleteApplications(@Body() dto: AdminDeleteManyDto) {
    return this.trainingSeminarService.deleteApplications(dto.ids);
  }

  // ===== INSIGHTS (통합: Categories + Columns) =====
  // GET admin/content/insights - 모든 카테고리 목록 조회
  @ApiOperation({ summary: '인사이트 카테고리 목록 조회 (모든 카테고리)' })
  @ApiResponse({ status: 200, description: '카테고리 목록 조회 성공' })
  @ApiQuery({ name: 'search', required: false, description: '카테고리명 검색' })
  @ApiQuery({ name: 'boardType', required: false, enum: ['갤러리', '스니펫', '게시판'], description: '게시판 유형 필터' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @Get('insights')
  async listInsights(
    @Query('search') search?: string,
    @Query('boardType') boardType?: string,
    @Query('category') category?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    // category 파라미터가 있으면 해당 카테고리의 아이템 목록 반환
    if (category) {
      if (category === 'column' || category.toLowerCase() === 'column') {
        // Column 카테고리의 아이템 목록 (columns)
        return this.columnService.findAll({ 
          search, 
          page: Number(page), 
          limit: Number(limit), 
          includeHidden: true 
        });
      } else {
        // 다른 카테고리의 아이템 목록 (data room contents)
        // 카테고리명으로 data room 찾기
        try {
          const matchingRoom = await this.dataRoomService.findRoomByName(category);
          // 해당 카테고리의 콘텐츠 목록 반환
          return this.dataRoomService.findContents(matchingRoom.id, {
            search,
            page: Number(page),
            limit: Number(limit),
            includeHidden: true,
          });
        } catch (error) {
          return { items: [], total: 0, page: Number(page), limit: Number(limit) };
        }
      }
    }
    
    // category 파라미터가 없으면 모든 카테고리 목록 반환 (data rooms + column 기본 카테고리)
    const roomsResult = await this.dataRoomService.findAllRooms({ 
      search, 
      boardType, 
      page: Number(page), 
      limit: Number(limit), 
      includeHidden: true 
    });

    // Column은 기본 카테고리이므로 목록에 포함
    // 검색어가 없거나 "column"과 관련된 검색어인 경우에만 column 카테고리 추가
    const shouldIncludeColumn = !search || 
      search.toLowerCase().includes('column') || 
      search.toLowerCase().includes('칼럼');

    if (shouldIncludeColumn && (!boardType || boardType === '갤러리')) {
      // Column 카테고리의 실제 아이템 개수 조회
      const columnCountResult = await this.columnService.findAll({ 
        includeHidden: true,
        page: 1,
        limit: 1,
      });

      // Column 카테고리 정보 추가 (boardType이 없거나 갤러리인 경우)
      const columnCategory = {
        id: 0, // 특별 ID로 표시
        name: 'column',
        nameLabel: 'Column',
        boardType: '갤러리',
        boardTypeLabel: '갤러리',
        exposureType: 'ALL',
        exposureTypeLabel: '전체',
        enableComments: false,
        commentsLabel: 'N',
        isExposed: true,
        exposedLabel: 'Y',
        contentCount: columnCountResult.total,
        createdAt: new Date(),
        createdAtFormatted: '',
        updatedAt: new Date(),
        updatedAtFormatted: '',
        isDefault: true, // 기본 카테고리 표시
      };

      // Column 카테고리를 첫 번째로 추가
      return {
        items: [columnCategory, ...roomsResult.items],
        total: roomsResult.total + 1,
        page: roomsResult.page,
        limit: roomsResult.limit,
      };
    }

    return roomsResult;
  }

  // POST admin/content/insights - 새 카테고리 생성 (category 파라미터 없음)
  // POST admin/content/insights?category=column - Column 카테고리에 아이템 생성
  // POST admin/content/insights?category=<categoryName> - 다른 카테고리에 아이템 생성
  @ApiOperation({ summary: '인사이트 카테고리 생성 또는 카테고리에 아이템 생성' })
  @ApiResponse({ status: 201, description: '생성 성공' })
  @ApiQuery({ name: 'category', required: false, description: '카테고리명 (없으면 카테고리 생성, 있으면 아이템 생성)' })
  @ApiBody({
    description: '카테고리 또는 아이템 생성 정보',
    schema: {
      type: 'object',
      properties: {
        // 카테고리 생성 시
        name: { type: 'string', description: '카테고리명 (카테고리 생성 시 필수)' },
        boardType: { type: 'string', enum: ['갤러리', '스니펫', '게시판'], description: '게시판 유형 (카테고리 생성 시 필수)' },
        exposureType: { type: 'string', enum: ['ALL', 'GENERAL', 'INSURANCE', 'OTHER'], description: '노출 유형 (기본: ALL)' },
        enableComments: { type: 'boolean', description: '댓글 기능 사용 여부 (기본: false)' },
        isExposed: { type: 'boolean', description: '노출 여부 (기본: true)' },
        // 아이템 생성 시
        categoryName: { type: 'string', description: '카테고리명 (선택)' },
        thumbnailUrl: { type: 'string', description: '썸네일 이미지 URL (column인 경우 필수)' },
        imageUrl: { type: 'string', description: '대표 이미지 URL (다른 카테고리인 경우 선택)' },
        body: { type: 'string', description: '본문 HTML' },
        authorName: { type: 'string', description: '작성자 이름' },
        isMainExposed: { type: 'boolean', description: '메인 노출 여부 (column인 경우, 기본: false)' },
        displayOrder: { type: 'number', description: '표시 순서 (기본: 0)' },
        attachmentUrl: { type: 'string', description: '첨부파일 URL (다른 카테고리인 경우)' },
        displayBodyHtml: { type: 'boolean', description: '본문 노출 여부 (다른 카테고리인 경우, 기본: true)' },
      },
    },
  })
  @Post('insights')
  async createInsight(
    @Body() body: any,
    @Query('category') category: string | undefined,
  ) {
    // category 파라미터가 없으면 카테고리 생성
    if (!category) {
      if (!body.name || !body.boardType) {
        throw new BadRequestException('카테고리 생성 시 name과 boardType이 필요합니다.');
      }
      // 카테고리는 data room으로 저장
      return this.dataRoomService.createRoom(body);
    }

    // category 파라미터가 있으면 아이템 생성
    if (category === 'column' || category.toLowerCase() === 'column') {
      // Column 카테고리에 아이템 생성
      if (!body.name) {
        throw new BadRequestException('아이템명이 필요합니다.');
      }
      if (!body.thumbnailUrl) {
        throw new BadRequestException('썸네일 이미지 URL이 필요합니다.');
      }
      if (!body.body) {
        throw new BadRequestException('본문이 필요합니다.');
      }
      return this.columnService.create({
        ...body,
        categoryName: body.categoryName || 'column',
      });
    } else {
      // 다른 카테고리에 아이템 생성 (data room content)
      if (!body.name) {
        throw new BadRequestException('아이템명이 필요합니다.');
      }
      
      // 카테고리명으로 data room 찾기
      const matchingRoom = await this.dataRoomService.findRoomByName(category);

      return this.dataRoomService.createContent(matchingRoom.id, {
        ...body,
        categoryName: body.categoryName || category,
      });
    }
  }

  // GET admin/content/insights/:id - 카테고리 또는 아이템 상세 조회
  @ApiOperation({ summary: '인사이트 카테고리 또는 아이템 상세 조회' })
  @ApiResponse({ status: 200, description: '상세 조회 성공' })
  @ApiQuery({ name: 'category', required: false, description: '카테고리명 (없으면 카테고리, 있으면 아이템)' })
  @Get('insights/:id')
  async getInsightDetail(
    @Param('id', ParseIntPipe) id: number,
    @Query('category') category: string | undefined,
  ) {
    if (category === 'column' || category?.toLowerCase() === 'column') {
      // Column 아이템 상세
      return this.columnService.findById(id);
    } else if (category) {
      // 다른 카테고리의 아이템 상세 (data room content)
      return this.dataRoomService.findContentById(id);
    } else {
      // 카테고리 상세 (data room)
      return this.dataRoomService.findRoomById(id);
    }
  }

  // PATCH admin/content/insights/:id - 카테고리 또는 아이템 수정
  @ApiOperation({ summary: '인사이트 카테고리 또는 아이템 수정' })
  @ApiResponse({ status: 200, description: '수정 성공' })
  @ApiQuery({ name: 'category', required: false, description: '카테고리명 (없으면 카테고리, 있으면 아이템)' })
  @ApiBody({
    description: '수정 정보',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        boardType: { type: 'string', enum: ['갤러리', '스니펫', '게시판'] },
        exposureType: { type: 'string', enum: ['ALL', 'GENERAL', 'INSURANCE', 'OTHER'] },
        enableComments: { type: 'boolean' },
        isExposed: { type: 'boolean' },
        categoryName: { type: 'string' },
        thumbnailUrl: { type: 'string' },
        imageUrl: { type: 'string' },
        body: { type: 'string' },
        authorName: { type: 'string' },
        isMainExposed: { type: 'boolean' },
        displayOrder: { type: 'number' },
        attachmentUrl: { type: 'string' },
        displayBodyHtml: { type: 'boolean' },
      },
    },
  })
  @Patch('insights/:id')
  async updateInsight(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @Query('category') category: string | undefined,
  ) {
    if (category === 'column' || category?.toLowerCase() === 'column') {
      // Column 아이템 수정
      return this.columnService.update(id, body);
    } else if (category) {
      // 다른 카테고리의 아이템 수정 (data room content)
      return this.dataRoomService.updateContent(id, body);
    } else {
      // 카테고리 수정 (data room)
      return this.dataRoomService.updateRoom(id, body);
    }
  }

  // DELETE admin/content/insights/:id - 카테고리 또는 아이템 삭제
  @ApiOperation({ summary: '인사이트 카테고리 또는 아이템 삭제' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiQuery({ name: 'category', required: false, description: '카테고리명 (없으면 카테고리, 있으면 아이템)' })
  @Delete('insights/:id')
  async deleteInsight(
    @Param('id', ParseIntPipe) id: number,
    @Query('category') category: string | undefined,
  ) {
    if (category === 'column' || category?.toLowerCase() === 'column') {
      // Column 아이템 삭제
      return this.columnService.delete(id);
    } else if (category) {
      // 다른 카테고리의 아이템 삭제 (data room content)
      return this.dataRoomService.deleteContent(id);
    } else {
      // 카테고리 삭제 (data room)
      return this.dataRoomService.deleteRoom(id);
    }
  }

  // PATCH admin/content/insights/:id/toggle-exposure - 노출 토글
  @ApiOperation({ summary: '인사이트 카테고리 또는 아이템 노출 토글' })
  @ApiResponse({ status: 200, description: '토글 성공' })
  @ApiQuery({ name: 'category', required: false, description: '카테고리명 (없으면 카테고리, 있으면 아이템)' })
  @Patch('insights/:id/toggle-exposure')
  async toggleInsightExposure(
    @Param('id', ParseIntPipe) id: number,
    @Query('category') category: string | undefined,
  ) {
    if (category === 'column' || category?.toLowerCase() === 'column') {
      // Column 아이템 노출 토글
      return this.columnService.toggleExposure(id);
    } else if (category) {
      // 다른 카테고리의 아이템 노출 토글 (data room content)
      return this.dataRoomService.toggleContentExposure(id);
    } else {
      // 카테고리 노출 토글 (data room)
      return this.dataRoomService.toggleRoomExposure(id);
    }
  }

  // ===== COLUMNS (Insight) =====
  @ApiOperation({ summary: '칼럼 목록 (검색: 칼럼명, 필터: 카테고리/노출여부/메인노출)' })
  @Get('columns')
  listColumns(@Query() query: any) {
    return this.columnService.findAll({ ...query, includeHidden: true });
  }

  @ApiOperation({ summary: '칼럼 카테고리 목록 (드롭다운용)' })
  @Get('columns/categories')
  getColumnCategories() {
    return this.columnService.getCategories();
  }

  @ApiOperation({ summary: '칼럼 상세' })
  @Get('columns/:id')
  getColumn(@Param('id', ParseIntPipe) id: number) {
    return this.columnService.findById(id);
  }

  @ApiOperation({ summary: '칼럼 생성' })
  @ApiBody({
    description: '칼럼 생성 정보',
    schema: {
      type: 'object',
      required: ['name', 'categoryName', 'thumbnailUrl', 'body'],
      properties: {
        name: { type: 'string', description: '칼럼명 (필수)' },
        categoryName: { type: 'string', description: '카테고리명 (필수)' },
        thumbnailUrl: { type: 'string', description: '썸네일 이미지 URL (필수)' },
        body: { type: 'string', description: '본문 HTML (필수)' },
        authorName: { type: 'string', description: '작성자 이름 (선택)' },
        isMainExposed: { type: 'boolean', description: '메인 노출 여부 (기본: false)' },
        isExposed: { type: 'boolean', description: '노출 여부 (기본: true)' },
        displayOrder: { type: 'number', description: '표시 순서 (기본: 0)' },
      },
    },
  })
  @Post('columns')
  createColumn(@Body() body: any) {
    return this.columnService.create(body);
  }

  @ApiOperation({ summary: '칼럼 수정' })
  @ApiBody({
    description: '칼럼 수정 정보',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '칼럼명' },
        categoryName: { type: 'string', description: '카테고리명' },
        thumbnailUrl: { type: 'string', description: '썸네일 이미지 URL' },
        body: { type: 'string', description: '본문 HTML' },
        authorName: { type: 'string', description: '작성자 이름' },
        isMainExposed: { type: 'boolean', description: '메인 노출 여부' },
        isExposed: { type: 'boolean', description: '노출 여부' },
        displayOrder: { type: 'number', description: '표시 순서' },
      },
    },
  })
  @Patch('columns/:id')
  updateColumn(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.columnService.update(id, body);
  }

  @ApiOperation({ summary: '칼럼 삭제' })
  @Delete('columns/:id')
  deleteColumn(@Param('id', ParseIntPipe) id: number) {
    return this.columnService.delete(id);
  }

  @ApiOperation({ summary: '칼럼 다중 삭제' })
  @Delete('columns/bulk')
  deleteColumns(@Body() dto: AdminDeleteManyDto) {
    return this.columnService.deleteMany(dto.ids);
  }

  @ApiOperation({ summary: '칼럼 노출 토글' })
  @Patch('columns/:id/toggle-exposure')
  toggleColumnExposure(@Param('id', ParseIntPipe) id: number) {
    return this.columnService.toggleExposure(id);
  }

  @ApiOperation({ summary: '칼럼 메인 노출 토글' })
  @Patch('columns/:id/toggle-main-exposure')
  toggleColumnMainExposure(@Param('id', ParseIntPipe) id: number) {
    return this.columnService.toggleMainExposure(id);
  }

  @ApiOperation({ summary: '칼럼 순서 변경' })
  @ApiBody({
    description: '칼럼 순서 변경 정보',
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              displayOrder: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @Patch('columns/order')
  updateColumnOrder(@Body() body: { items: { id: number; displayOrder: number }[] }) {
    return this.columnService.updateOrder(body.items);
  }

  // ===== DATA ROOMS =====
  @ApiOperation({ summary: '자료실 목록 (검색: 자료실명, 필터: 노출유형/노출여부/댓글여부)' })
  @Get('data-rooms')
  listDataRooms(@Query() query: any) {
    return this.dataRoomService.findAllRooms({ ...query, includeHidden: true });
  }

  @ApiOperation({ summary: '자료실 상세' })
  @Get('data-rooms/:id')
  getDataRoom(@Param('id', ParseIntPipe) id: number) {
    return this.dataRoomService.findRoomById(id);
  }

  @ApiOperation({ summary: '자료실 생성' })
  @ApiBody({
    description: '자료실 생성 정보',
    schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', description: '자료실 이름 (필수)' },
        boardType: { type: 'string', description: '게시판 유형 (선택, 갤러리/스니펫/게시판)' },
        exposureType: { type: 'string', enum: ['ALL', 'GENERAL', 'INSURANCE', 'OTHER'], description: '노출 유형 (기본: ALL)' },
        enableComments: { type: 'boolean', description: '댓글 기능 사용 여부 (기본: false)' },
        isExposed: { type: 'boolean', description: '노출 여부 (기본: true)' },
      },
    },
  })
  @Post('data-rooms')
  createDataRoom(@Body() body: any) {
    return this.dataRoomService.createRoom(body);
  }

  @ApiOperation({ summary: '자료실 수정' })
  @ApiBody({
    description: '자료실 수정 정보',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '자료실 이름' },
        boardType: { type: 'string', description: '게시판 유형' },
        exposureType: { type: 'string', enum: ['ALL', 'GENERAL', 'INSURANCE', 'OTHER'], description: '노출 유형' },
        enableComments: { type: 'boolean', description: '댓글 기능 사용 여부' },
        isExposed: { type: 'boolean', description: '노출 여부' },
      },
    },
  })
  @Patch('data-rooms/:id')
  updateDataRoom(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.dataRoomService.updateRoom(id, body);
  }

  @ApiOperation({ summary: '자료실 삭제' })
  @Delete('data-rooms/:id')
  deleteDataRoom(@Param('id', ParseIntPipe) id: number) {
    return this.dataRoomService.deleteRoom(id);
  }

  @ApiOperation({ summary: '자료실 다중 삭제' })
  @Delete('data-rooms/bulk')
  deleteDataRooms(@Body() dto: AdminDeleteManyDto) {
    return this.dataRoomService.deleteRooms(dto.ids);
  }

  @ApiOperation({ summary: '자료실 노출 토글' })
  @Patch('data-rooms/:id/toggle-exposure')
  toggleDataRoomExposure(@Param('id', ParseIntPipe) id: number) {
    return this.dataRoomService.toggleRoomExposure(id);
  }

  @ApiOperation({ summary: '자료실 콘텐츠 목록 (검색: 콘텐츠명, 필터: 카테고리/노출여부)' })
  @Get('data-rooms/:id/contents')
  listDataRoomContents(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: any,
  ) {
    return this.dataRoomService.findContents(id, { ...query, includeHidden: true });
  }

  @ApiOperation({ summary: '자료실 콘텐츠 상세' })
  @Get('data-room-contents/:id')
  getDataRoomContent(@Param('id', ParseIntPipe) id: number) {
    return this.dataRoomService.findContentById(id);
  }

  @ApiOperation({ summary: '자료실 콘텐츠 생성' })
  @ApiBody({
    description: '자료실 콘텐츠 생성 정보',
    schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', description: '콘텐츠 이름 (필수)' },
        imageUrl: { type: 'string', description: '대표 이미지 URL (선택)' },
        body: { type: 'string', description: '본문 HTML (선택)' },
        displayBodyHtml: { type: 'boolean', description: '본문 노출 여부 (기본: true)' },
        categoryName: { type: 'string', description: '카테고리명 (선택)' },
        authorName: { type: 'string', description: '작성자 (선택)' },
        attachmentUrl: { type: 'string', description: '첨부파일 URL (선택)' },
        isExposed: { type: 'boolean', description: '노출 여부 (기본: true)' },
      },
    },
  })
  @Post('data-rooms/:id/contents')
  createDataRoomContent(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.dataRoomService.createContent(id, body);
  }

  @ApiOperation({ summary: '자료실 콘텐츠 수정' })
  @ApiBody({
    description: '자료실 콘텐츠 수정 정보',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '콘텐츠 이름' },
        imageUrl: { type: 'string', description: '대표 이미지 URL' },
        body: { type: 'string', description: '본문 HTML' },
        displayBodyHtml: { type: 'boolean', description: '본문 노출 여부' },
        categoryName: { type: 'string', description: '카테고리명' },
        authorName: { type: 'string', description: '작성자' },
        attachmentUrl: { type: 'string', description: '첨부파일 URL' },
        isExposed: { type: 'boolean', description: '노출 여부' },
      },
    },
  })
  @Patch('data-room-contents/:id')
  updateDataRoomContent(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.dataRoomService.updateContent(id, body);
  }

  @ApiOperation({ summary: '자료실 콘텐츠 삭제' })
  @Delete('data-room-contents/:id')
  deleteDataRoomContent(@Param('id', ParseIntPipe) id: number) {
    return this.dataRoomService.deleteContent(id);
  }

  @ApiOperation({ summary: '자료실 콘텐츠 다중 삭제' })
  @Delete('data-room-contents/bulk')
  deleteDataRoomContents(@Body() dto: AdminDeleteManyDto) {
    return this.dataRoomService.deleteContents(dto.ids);
  }

  @ApiOperation({ summary: '자료실 콘텐츠 노출 토글' })
  @Patch('data-room-contents/:id/toggle-exposure')
  toggleDataRoomContentExposure(@Param('id', ParseIntPipe) id: number) {
    return this.dataRoomService.toggleContentExposure(id);
  }

  @ApiOperation({ summary: '자료실 콘텐츠 조회수 증가' })
  @Patch('data-room-contents/:id/increment-view')
  incrementContentViewCount(@Param('id', ParseIntPipe) id: number) {
    return this.dataRoomService.incrementViewCount(id);
  }

  @ApiOperation({ summary: '신고된 댓글 목록' })
  @Get('data-room-comments/reported')
  listReportedComments(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.dataRoomService.findReportedComments(Number(page), Number(limit));
  }

  @ApiOperation({ summary: '댓글 숨김 처리' })
  @Patch('data-room-comments/:id/hide')
  hideComment(@Param('id', ParseIntPipe) id: number) {
    return this.dataRoomService.hideComment(id);
  }

  @ApiOperation({ summary: '댓글 삭제' })
  @Delete('data-room-comments/:id')
  deleteComment(@Param('id', ParseIntPipe) id: number) {
    return this.dataRoomService.deleteComment(id);
  }

  // ===== CATEGORIES =====
  @ApiOperation({ summary: '대분류 카테고리 목록 (검색: 카테고리명)' })
  @Get('categories/major')
  listMajorCategories(@Query() query: any) {
    return this.categoryService.findAllMajor({ ...query, includeHidden: true });
  }

  @ApiOperation({ summary: '대분류 카테고리 상세' })
  @Get('categories/major/:id')
  getMajorCategory(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.findMajorById(id);
  }

  @ApiOperation({ summary: '대분류 카테고리 생성' })
  @ApiBody({
    description: '대분류 카테고리 생성 정보',
    schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string' },
        isExposed: { type: 'boolean' },
      },
    },
  })
  @Post('categories/major')
  createMajorCategory(@Body() body: { name: string; isExposed?: boolean }) {
    return this.categoryService.createMajor(body.name, body.isExposed);
  }

  @ApiOperation({ summary: '대분류 카테고리 수정' })
  @ApiBody({
    description: '대분류 카테고리 수정 정보',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '카테고리명' },
        isExposed: { type: 'boolean', description: '노출 여부' },
      },
    },
  })
  @Patch('categories/major/:id')
  updateMajorCategory(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.categoryService.updateMajor(id, body);
  }

  @ApiOperation({ summary: '대분류 카테고리 삭제' })
  @Delete('categories/major/:id')
  deleteMajorCategory(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.deleteMajor(id);
  }

  @ApiOperation({ summary: '대분류 카테고리 다중 삭제' })
  @Delete('categories/major/bulk')
  deleteMajorCategories(@Body() dto: AdminDeleteManyDto) {
    return this.categoryService.deleteMajors(dto.ids);
  }

  @ApiOperation({ summary: '대분류 카테고리 노출 토글' })
  @Patch('categories/major/:id/toggle-exposure')
  toggleMajorCategoryExposure(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.toggleMajorExposure(id);
  }

  @ApiOperation({ summary: '대분류 카테고리 순서 변경' })
  @ApiBody({
    description: '대분류 카테고리 순서 변경 정보',
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              displayOrder: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @Patch('categories/major/order')
  updateMajorCategoryOrder(@Body() body: { items: { id: number; displayOrder: number }[] }) {
    return this.categoryService.updateMajorOrder(body.items);
  }

  @ApiOperation({ summary: '중분류 카테고리 목록 (검색: 중분류명)' })
  @Get('categories/major/:majorId/minor')
  listMinorCategories(@Param('majorId', ParseIntPipe) majorId: number, @Query() query: any) {
    return this.categoryService.findMinorsByMajor(majorId, { ...query, includeHidden: true });
  }

  @ApiOperation({ summary: '중분류 카테고리 상세' })
  @Get('categories/minor/:id')
  getMinorCategory(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.findMinorById(id);
  }

  @ApiOperation({ summary: '중분류 카테고리 생성' })
  @ApiBody({
    description: '중분류 카테고리 생성 정보',
    schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string' },
        isExposed: { type: 'boolean' },
      },
    },
  })
  @Post('categories/major/:majorId/minor')
  createMinorCategory(@Param('majorId', ParseIntPipe) majorId: number, @Body() body: { name: string; isExposed?: boolean }) {
    return this.categoryService.createMinor(majorId, body.name, body.isExposed);
  }

  @ApiOperation({ summary: '중분류 카테고리 수정' })
  @ApiBody({
    description: '중분류 카테고리 수정 정보',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '카테고리명' },
        isExposed: { type: 'boolean', description: '노출 여부' },
      },
    },
  })
  @Patch('categories/minor/:id')
  updateMinorCategory(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.categoryService.updateMinor(id, body);
  }

  @ApiOperation({ summary: '중분류 카테고리 삭제' })
  @Delete('categories/minor/:id')
  deleteMinorCategory(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.deleteMinor(id);
  }

  @ApiOperation({ summary: '중분류 카테고리 다중 삭제' })
  @Delete('categories/minor/bulk')
  deleteMinorCategories(@Body() dto: AdminDeleteManyDto) {
    return this.categoryService.deleteMinors(dto.ids);
  }

  @ApiOperation({ summary: '중분류 카테고리 노출 토글' })
  @Patch('categories/minor/:id/toggle-exposure')
  toggleMinorCategoryExposure(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.toggleMinorExposure(id);
  }

  @ApiOperation({ summary: '중분류 카테고리 순서 변경' })
  @ApiBody({
    description: '중분류 카테고리 순서 변경 정보',
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              displayOrder: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @Patch('categories/minor/order')
  updateMinorCategoryOrder(@Body() body: { items: { id: number; displayOrder: number }[] }) {
    return this.categoryService.updateMinorOrder(body.items);
  }

  // ===== TAX MEMBERS (세무사 회원 프로필) =====
  @ApiOperation({ summary: '구성원 목록 조회 (검색: 보험사명/구성원명, 필터: 업무분야/노출여부)' })
  @ApiResponse({ status: 200, description: '목록 조회 성공' })
  @Get('tax-members')
  listTaxMembers(@Query() query: AdminTaxMemberQueryDto) {
    return this.taxMemberService.findAll({ ...query, includeHidden: true });
  }

  @ApiOperation({ summary: '구성원 상세 조회' })
  @ApiResponse({ status: 200, description: '상세 조회 성공' })
  @ApiResponse({ status: 404, description: '구성원 없음' })
  @Get('tax-members/:id')
  getTaxMember(@Param('id', ParseIntPipe) id: number) {
    return this.taxMemberService.findById(id);
  }

  @ApiOperation({ summary: '구성원 추가' })
  @ApiBody({ type: AdminCreateTaxMemberDto, description: '구성원 생성 정보' })
  @ApiResponse({ status: 201, description: '구성원 추가 성공' })
  @Post('tax-members')
  createTaxMember(@Body() dto: AdminCreateTaxMemberDto) {
    return this.taxMemberService.create(dto);
  }

  @ApiOperation({ summary: '구성원 수정' })
  @ApiBody({ type: AdminUpdateTaxMemberDto, description: '구성원 수정 정보' })
  @ApiResponse({ status: 200, description: '구성원 수정 성공' })
  @ApiResponse({ status: 404, description: '구성원 없음' })
  @Patch('tax-members/:id')
  updateTaxMember(@Param('id', ParseIntPipe) id: number, @Body() dto: AdminUpdateTaxMemberDto) {
    return this.taxMemberService.update(id, dto);
  }

  @ApiOperation({ summary: '세무사 회원 삭제' })
  @Delete('tax-members/:id')
  deleteTaxMember(@Param('id', ParseIntPipe) id: number) {
    return this.taxMemberService.delete(id);
  }

  @ApiOperation({ summary: '세무사 회원 다중 삭제' })
  @Delete('tax-members')
  deleteTaxMembers(@Body() dto: AdminDeleteManyDto) {
    return this.taxMemberService.deleteMany(dto.ids);
  }

  @ApiOperation({ summary: '세무사 회원 노출 토글' })
  @Patch('tax-members/:id/toggle-exposure')
  toggleTaxMemberExposure(@Param('id', ParseIntPipe) id: number) {
    return this.taxMemberService.toggleExposure(id);
  }

  @ApiOperation({ summary: '세무사 회원 순서 변경' })
  @ApiBody({
    description: '세무사 회원 순서 변경 정보',
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              displayOrder: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @Patch('tax-members/order')
  updateTaxMemberOrder(@Body() body: { items: { id: number; displayOrder: number }[] }) {
    return this.taxMemberService.updateOrder(body.items);
  }

  // ===== EXPOSURE SETTINGS =====
  @ApiOperation({ summary: '노출 설정 조회 (Awards Main, Newsletter Page, History Page)' })
  @Get('exposure-settings')
  getExposureSettings() {
    return this.exposureSettingsService.getAll();
  }

  @ApiOperation({ summary: '노출 설정 수정' })
  @ApiBody({
    description: '노출 설정 수정 정보',
    schema: {
      type: 'object',
      required: ['value'],
      properties: {
        value: { type: 'any', description: '설정 값 (필수)' },
      },
    },
  })
  @Patch('exposure-settings/:key')
  updateExposureSetting(@Param('key') key: string, @Body() body: { value: any }) {
    return this.exposureSettingsService.set(key, body.value);
  }

  @ApiOperation({ summary: 'Awards 메인 노출 설정 (Y/N, 기본: N)' })
  @ApiBody({
    description: 'Awards 메인 노출 설정',
    schema: {
      type: 'object',
      required: ['exposed'],
      properties: {
        exposed: { type: 'boolean', description: '노출 여부 (필수)' },
      },
    },
  })
  @Patch('exposure-settings/awards-main')
  setAwardsMainExposure(@Body() body: { exposed: boolean }) {
    return this.exposureSettingsService.setAwardsMainExposed(body.exposed);
  }

  @ApiOperation({ summary: 'Newsletter 페이지 노출 설정 (Y/N, 기본: N)' })
  @ApiBody({
    description: 'Newsletter 페이지 노출 설정',
    schema: {
      type: 'object',
      required: ['exposed'],
      properties: {
        exposed: { type: 'boolean', description: '노출 여부 (필수)' },
      },
    },
  })
  @Patch('exposure-settings/newsletter-page')
  setNewsletterPageExposure(@Body() body: { exposed: boolean }) {
    return this.exposureSettingsService.setNewsletterPageExposed(body.exposed);
  }

  @ApiOperation({ summary: 'History 페이지 노출 설정 (Y/N, 기본: N)' })
  @ApiBody({
    description: 'History 페이지 노출 설정',
    schema: {
      type: 'object',
      required: ['exposed'],
      properties: {
        exposed: { type: 'boolean', description: '노출 여부 (필수)' },
      },
    },
  })
  @Patch('exposure-settings/history-page')
  setHistoryPageExposure(@Body() body: { exposed: boolean }) {
    return this.exposureSettingsService.setHistoryPageExposed(body.exposed);
  }
}

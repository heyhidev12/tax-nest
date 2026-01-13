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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { MainBannerService } from 'src/components/content/services/main-banner.service';
import { HistoryService } from 'src/components/content/services/history.service';
import { AwardService } from 'src/components/content/services/award.service';
import { BranchService } from 'src/components/content/services/branch.service';
import { KeyCustomerService } from 'src/components/content/services/key-customer.service';
import { BusinessAreaService } from 'src/components/content/services/business-area.service';
import { CreateBusinessAreaCategoryDto } from 'src/libs/dto/business-area/create-category.dto';
import { UpdateBusinessAreaCategoryDto } from 'src/libs/dto/business-area/update-category.dto';
import { CreateBusinessAreaItemDto } from 'src/libs/dto/business-area/create-item.dto';
import { UpdateBusinessAreaItemDto } from 'src/libs/dto/business-area/update-item.dto';
import { TrainingSeminarService } from 'src/components/content/services/training-seminar.service';
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
import { UpdateHistoryYearOrderDto } from 'src/libs/dto/history/update-year-order.dto';

import { AdminBaseController } from './admin-base.controller';

@ApiTags('Admin Content')
@Controller('admin/content')
export class AdminContentController extends AdminBaseController {
  constructor(
    private readonly bannerService: MainBannerService,
    private readonly historyService: HistoryService,
    private readonly awardService: AwardService,
    private readonly branchService: BranchService,
    private readonly keyCustomerService: KeyCustomerService,
    private readonly businessAreaService: BusinessAreaService,
    private readonly trainingSeminarService: TrainingSeminarService,
    private readonly taxMemberService: TaxMemberService,
    private readonly exposureSettingsService: ExposureSettingsService,
  ) {
    super();
  }

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
        mediaType: {
          type: 'string',
          enum: ['IMAGE', 'VIDEO'],
          description: '미디어 타입 (필수)',
        },
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
        mediaType: {
          type: 'string',
          enum: ['IMAGE', 'VIDEO'],
          description: '미디어 타입',
        },
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

  @ApiOperation({ summary: '메인 배너 다중 삭제' })
  @Delete('banners/bulk')
  deleteBanners(@Body() dto: AdminDeleteManyDto) {
    return this.bannerService.deleteMany(dto.ids);
  }

  @ApiOperation({ summary: '메인 배너 삭제' })
  @Delete('banners/:id')
  deleteBanner(@Param('id', ParseIntPipe) id: number) {
    return this.bannerService.delete(id);
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
  updateBannerOrder(
    @Body() body: { items: { id: number; displayOrder: number }[] },
  ) {
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

  @ApiOperation({ summary: '연혁 연도 순서 변경' })
  @ApiBody({ type: UpdateHistoryYearOrderDto })
  @Patch('history/years/order')
  updateHistoryYearOrder(@Body() dto: UpdateHistoryYearOrderDto) {
    return this.historyService.updateYearOrder(dto.items);
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

  @ApiOperation({ summary: '연혁 연도 다중 삭제' })
  @Delete('history/years/bulk')
  deleteHistoryYears(@Body() dto: AdminDeleteManyDto) {
    return this.historyService.deleteYears(dto.ids);
  }

  @ApiOperation({ summary: '연혁 연도 삭제' })
  @Delete('history/years/:id')
  deleteHistoryYear(@Param('id', ParseIntPipe) id: number) {
    return this.historyService.deleteYear(id);
  }

  @ApiOperation({ summary: '연혁 연도 노출 토글' })
  @Patch('history/years/:id/toggle-exposure')
  toggleHistoryYearExposure(@Param('id', ParseIntPipe) id: number) {
    return this.historyService.toggleYearExposure(id);
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

  @ApiOperation({ summary: '연혁 항목 다중 삭제' })
  @Delete('history/items/bulk')
  deleteHistoryItems(@Body() dto: AdminDeleteManyDto) {
    return this.historyService.deleteItems(dto.ids);
  }

  @ApiOperation({ summary: '연혁 항목 삭제' })
  @Delete('history/items/:id')
  deleteHistoryItem(@Param('id', ParseIntPipe) id: number) {
    return this.historyService.deleteItem(id);
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
  updateHistoryItemOrder(
    @Body() body: { items: { id: number; displayOrder: number }[] },
  ) {
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
  createAwardYear(
    @Body()
    body: {
      yearName: string;
      isMainExposed?: boolean;
      isExposed?: boolean;
    },
  ) {
    return this.awardService.createYear(
      body.yearName,
      body.isMainExposed,
      body.isExposed,
    );
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
  updateAwardYearOrder(
    @Body() body: { items: { id: number; displayOrder: number }[] },
  ) {
    return this.awardService.updateYearOrder(body.items);
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

  @ApiOperation({ summary: '수상/인증 연도 다중 삭제' })
  @Delete('awards/years/bulk')
  deleteAwardYears(@Body() dto: AdminDeleteManyDto) {
    return this.awardService.deleteYears(dto.ids);
  }

  @ApiOperation({ summary: '수상/인증 연도 삭제' })
  @Delete('awards/years/:id')
  deleteAwardYear(@Param('id', ParseIntPipe) id: number) {
    return this.awardService.deleteYear(id);
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
      required: ['name', 'source', 'image'],
      properties: {
        name: { type: 'string', description: '수상/인증 명칭 (필수)' },
        source: { type: 'string', description: '출처 (필수)' },
        image: {
          type: 'object',
          description: '이미지 (필수)',
          properties: {
            id: { type: 'number', description: 'Attachment ID' },
            url: { type: 'string', description: '이미지 URL' },
          },
        },
        isMainExposed: {
          type: 'boolean',
          description: '메인 노출 여부 (기본: false)',
        },
        isExposed: { type: 'boolean', description: '노출 여부 (기본: true)' },
      },
    },
  })
  @Post('awards/years/:yearId/awards')
  createAward(
    @Param('yearId', ParseIntPipe) yearId: number,
    @Body()
    body: {
      name: string;
      source: string;
      image: { id: number; url: string };
      isMainExposed?: boolean;
      isExposed?: boolean;
    },
  ) {
    return this.awardService.createAward(yearId, body);
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
  updateAwardOrder(
    @Body() body: { items: { id: number; displayOrder: number }[] },
  ) {
    return this.awardService.updateAwardOrder(body.items);
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

  @ApiOperation({ summary: '수상/인증 다중 삭제' })
  @Delete('awards/bulk')
  deleteAwards(@Body() dto: AdminDeleteManyDto) {
    return this.awardService.deleteAwards(dto.ids);
  }

  @ApiOperation({ summary: '수상/인증 삭제' })
  @Delete('awards/:id')
  deleteAward(@Param('id', ParseIntPipe) id: number) {
    return this.awardService.deleteAward(id);
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
  updateBranchOrder(
    @Body() body: { items: { id: number; displayOrder: number }[] },
  ) {
    return this.branchService.updateOrder(body.items);
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
  @ApiOperation({ summary: '본사/지점 다중 삭제' })
  @Delete('branches/bulk')
  deleteBranches(@Body() dto: AdminDeleteManyDto) {
    return this.branchService.deleteMany(dto.ids);
  }

  @ApiOperation({ summary: '본사/지점 삭제' })
  @Delete('branches/:id')
  deleteBranch(@Param('id', ParseIntPipe) id: number) {
    return this.branchService.delete(id);
  }

  @ApiOperation({ summary: '본사/지점 노출 토글' })
  @Patch('branches/:id/toggle-exposure')
  toggleBranchExposure(@Param('id', ParseIntPipe) id: number) {
    return this.branchService.toggleExposure(id);
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
        name: {
          type: 'string',
          description: '고객사 이름 (선택, 내부 관리용)',
        },
        displayOrder: { type: 'number', description: '표시 순서 (기본: 0)' },
        isMainExposed: {
          type: 'boolean',
          description: '메인 노출 여부 (기본: false)',
        },
        isExposed: { type: 'boolean', description: '노출 여부 (기본: true)' },
      },
    },
  })
  @Post('key-customers')
  createKeyCustomer(@Body() body: any) {
    return this.keyCustomerService.create(body);
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
  updateKeyCustomerOrder(
    @Body() body: { items: { id: number; displayOrder: number }[] },
  ) {
    return this.keyCustomerService.updateOrder(body.items);
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

  @ApiOperation({ summary: '주요 고객 다중 삭제' })
  @Delete('key-customers/bulk')
  deleteKeyCustomers(@Body() dto: AdminDeleteManyDto) {
    return this.keyCustomerService.deleteMany(dto.ids);
  }

  @ApiOperation({ summary: '주요 고객 삭제' })
  @Delete('key-customers/:id')
  deleteKeyCustomer(@Param('id', ParseIntPipe) id: number) {
    return this.keyCustomerService.delete(id);
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

  // ===== BUSINESS AREAS =====

  // ===== BUSINESS AREAS - CATEGORIES =====
  @ApiOperation({
    summary: 'Business Areas 카테고리 목록 조회 (Major Category별 그룹화)',
  })
  @ApiResponse({
    status: 200,
    description: 'Major Category별로 그룹화된 카테고리 목록',
  })
  @Get('business-areas/categories')
  getBusinessAreaCategories(@Query('includeHidden') includeHidden?: string) {
    return this.businessAreaService.getCategoriesGroupedByMajor(
      includeHidden === 'true',
    );
  }

  @ApiOperation({ summary: 'Major Category별 Business Areas 카테고리 목록' })
  @ApiResponse({ status: 200, description: 'Major Category별 카테고리 목록' })
  @Get('business-areas/categories/by-major/:majorCategoryId')
  getBusinessAreaCategoriesByMajor(
    @Param('majorCategoryId', ParseIntPipe) majorCategoryId: number,
    @Query('includeHidden') includeHidden?: string,
  ) {
    return this.businessAreaService.getCategoriesByMajorCategory(
      majorCategoryId,
      includeHidden === 'true',
    );
  }

  @ApiOperation({ summary: 'Business Areas 카테고리 상세 조회' })
  @Get('business-areas/categories/:id')
  getBusinessAreaCategory(@Param('id', ParseIntPipe) id: number) {
    return this.businessAreaService.getCategoryById(id, true);
  }

  @ApiOperation({
    summary: 'Business Areas 카테고리 생성',
    description: 'Major Category는 /admin/insights/subcategories에서 선택',
  })
  @Post('business-areas/categories')
  createBusinessAreaCategory(@Body() dto: CreateBusinessAreaCategoryDto) {
    return this.businessAreaService.createCategory(dto);
  }

  @ApiOperation({ summary: 'Business Areas 카테고리 수정' })
  @Patch('business-areas/categories/:id')
  updateBusinessAreaCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBusinessAreaCategoryDto,
  ) {
    return this.businessAreaService.updateCategory(id, dto);
  }

  @ApiOperation({
    summary: 'Business Areas 카테고리 삭제',
    description: '사용 중인 카테고리는 삭제할 수 없습니다.',
  })
  @Delete('business-areas/categories/:id')
  deleteBusinessAreaCategory(@Param('id', ParseIntPipe) id: number) {
    return this.businessAreaService.deleteCategory(id);
  }

  @ApiOperation({ summary: 'Business Areas 카테고리 노출 토글' })
  @Patch('business-areas/categories/:id/toggle-exposure')
  toggleBusinessAreaCategoryExposure(@Param('id', ParseIntPipe) id: number) {
    return this.businessAreaService.toggleCategoryExposure(id);
  }

  // ===== BUSINESS AREAS - ITEMS =====
  @ApiOperation({
    summary:
      '업무분야 아이템 목록 (검색: 업무분야명, 필터: 대분류/중분류/노출여부)',
  })
  @Get('business-areas')
  listBusinessAreas(@Query() query: any) {
    const { majorCategoryId, minorCategoryId, ...rest } = query;
    return this.businessAreaService.findAll({
      ...rest,
      majorCategoryId: majorCategoryId ? Number(majorCategoryId) : undefined,
      minorCategoryId: minorCategoryId ? Number(minorCategoryId) : undefined,
      includeHidden: true,
    });
  }

  @ApiOperation({ summary: '업무분야 아이템 상세' })
  @Get('business-areas/:id')
  getBusinessArea(@Param('id', ParseIntPipe) id: number) {
    return this.businessAreaService.findById(id);
  }

  @ApiOperation({
    summary: '업무분야 아이템 생성',
    description:
      'Major Category는 /admin/insights/subcategories에서, Minor Category는 Business Areas categories에서 선택',
  })
  @Post('business-areas')
  createBusinessAreaItem(@Body() dto: CreateBusinessAreaItemDto) {
    return this.businessAreaService.createItem(dto);
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
  updateBusinessAreaOrder(
    @Body() body: { items: { id: number; displayOrder: number }[] },
  ) {
    return this.businessAreaService.updateOrder(body.items);
  }

  @ApiOperation({ summary: '업무분야 아이템 수정' })
  @Patch('business-areas/:id')
  updateBusinessAreaItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBusinessAreaItemDto,
  ) {
    return this.businessAreaService.updateItem(id, dto);
  }

  @ApiOperation({ summary: '업무분야 다중 삭제' })
  @Delete('business-areas/bulk')
  deleteBusinessAreas(@Body() dto: AdminDeleteManyDto) {
    return this.businessAreaService.deleteMany(dto.ids);
  }

  @ApiOperation({ summary: '업무분야 아이템 삭제' })
  @Delete('business-areas/:id')
  deleteBusinessAreaItem(@Param('id', ParseIntPipe) id: number) {
    return this.businessAreaService.delete(id);
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

  // ===== TRAINING/SEMINARS =====
  @ApiOperation({
    summary:
      '교육/세미나 목록 조회 (검색: 교육/세미나명, 필터: 유형/모집유형/회원유형/노출여부)',
  })
  @ApiResponse({ status: 200, description: '목록 조회 성공' })
  @Get('training-seminars')
  listTrainingSeminars(@Query() query: AdminTrainingSeminarQueryDto) {
    return this.trainingSeminarService.findAll({
      ...query,
      includeHidden: true,
    });
  }

  @ApiOperation({ summary: '교육/세미나 상세 조회' })
  @ApiResponse({ status: 200, description: '상세 조회 성공' })
  @ApiResponse({ status: 404, description: '교육/세미나 없음' })
  @Get('training-seminars/:id')
  getTrainingSeminar(@Param('id', ParseIntPipe) id: number) {
    return this.trainingSeminarService.findById(id);
  }

  @ApiOperation({ summary: '교육/세미나 추가' })
  @ApiBody({
    type: AdminCreateTrainingSeminarDto,
    description: '교육/세미나 생성 정보',
  })
  @ApiResponse({ status: 201, description: '교육/세미나 추가 성공' })
  @ApiResponse({ status: 400, description: '선착순 모집의 경우 정원 필수' })
  @Post('training-seminars')
  createTrainingSeminar(@Body() dto: AdminCreateTrainingSeminarDto) {
    return this.trainingSeminarService.create(dto as any);
  }

  @ApiOperation({ summary: '교육/세미나 수정' })
  @ApiBody({
    type: AdminUpdateTrainingSeminarDto,
    description: '교육/세미나 수정 정보',
  })
  @ApiResponse({ status: 200, description: '교육/세미나 수정 성공' })
  @ApiResponse({ status: 404, description: '교육/세미나 없음' })
  @ApiResponse({ status: 400, description: '선착순 모집의 경우 정원 필수' })
  @Patch('training-seminars/:id')
  updateTrainingSeminar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminUpdateTrainingSeminarDto,
  ) {
    return this.trainingSeminarService.update(id, dto as any);
  }

  @ApiOperation({ summary: '교육/세미나 다중 삭제' })
  @Delete('training-seminars/bulk')
  deleteTrainingSeminars(@Body() dto: AdminDeleteManyDto) {
    return this.trainingSeminarService.deleteMany(dto.ids);
  }

  @ApiOperation({ summary: '교육/세미나 삭제' })
  @Delete('training-seminars/:id')
  deleteTrainingSeminar(@Param('id', ParseIntPipe) id: number) {
    return this.trainingSeminarService.delete(id);
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
  listApplications(@Param('id', ParseIntPipe) id: number, @Query() query: any) {
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

  @ApiOperation({ summary: '신청 다중 삭제' })
  @Delete('training-seminar-applications/bulk')
  deleteApplications(@Body() dto: AdminDeleteManyDto) {
    return this.trainingSeminarService.deleteApplications(dto.ids);
  }

  @ApiOperation({ summary: '신청 삭제' })
  @Delete('training-seminar-applications/:id')
  deleteApplication(@Param('id', ParseIntPipe) id: number) {
    return this.trainingSeminarService.deleteApplication(id);
  }

  // ===== TAX MEMBERS (세무사 회원 프로필) =====
  @ApiOperation({
    summary:
      '구성원 목록 조회 (검색: 보험사명/구성원명, 필터: 업무분야/노출여부)',
  })
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
  updateTaxMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminUpdateTaxMemberDto,
  ) {
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
  updateTaxMemberOrder(
    @Body() body: { items: { id: number; displayOrder: number }[] },
  ) {
    return this.taxMemberService.updateOrder(body.items);
  }

  // ===== EXPOSURE SETTINGS =====
  @ApiOperation({
    summary: '노출 설정 조회 (Awards Main, Newsletter Page, History Page)',
  })
  @Get('exposure-settings')
  getExposureSettings() {
    return this.exposureSettingsService.getAll();
  }

  @ApiOperation({ summary: 'Awards 메인 노출 설정 (Y/N, 기본: N)' })
  @ApiBody({
    description: 'Awards 메인 노출 설정',
    schema: {
      type: 'object',
      required: ['isExposed'],
      properties: {
        isExposed: { type: 'boolean', description: '노출 여부 (필수)' },
      },
    },
  })
  @Patch('exposure-settings/awards-main')
  setAwardsMainExposure(@Body() body: { isExposed: boolean }) {
    return this.exposureSettingsService.setAwardsMainExposed(body.isExposed);
  }

  @ApiOperation({ summary: 'Newsletter 페이지 노출 설정 (Y/N, 기본: N)' })
  @ApiBody({
    description: 'Newsletter 페이지 노출 설정',
    schema: {
      type: 'object',
      required: ['isExposed'],
      properties: {
        isExposed: { type: 'boolean', description: '노출 여부 (필수)' },
      },
    },
  })
  @Patch('exposure-settings/newsletter-page')
  setNewsletterPageExposure(@Body() body: { isExposed: boolean }) {
    return this.exposureSettingsService.setNewsletterPageExposed(
      body.isExposed,
    );
  }

  @ApiOperation({ summary: 'History 페이지 노출 설정 (Y/N, 기본: N)' })
  @ApiBody({
    description: 'History 페이지 노출 설정',
    schema: {
      type: 'object',
      required: ['isExposed'],
      properties: {
        isExposed: { type: 'boolean', description: '노출 여부 (필수)' },
      },
    },
  })
  @Patch('exposure-settings/history-page')
  setHistoryPageExposure(@Body() body: { isExposed: boolean }) {
    return this.exposureSettingsService.setHistoryPageExposed(body.isExposed);
  }

  @ApiOperation({ summary: '노출 설정 수정 (Generic, 기타 키용)' })
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
  updateExposureSetting(
    @Param('key') key: string,
    @Body() body: { value: any },
  ) {
    return this.exposureSettingsService.set(key, body.value);
  }
}

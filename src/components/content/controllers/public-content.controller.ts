import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Post,
  Body,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TaxMemberService } from '../services/tax-member.service';
import { AwardService } from '../services/award.service';
import { TrainingSeminarService } from '../services/training-seminar.service';
import { MainBannerService } from '../services/main-banner.service';
import { BranchService } from '../services/branch.service';
import { KeyCustomerService } from '../services/key-customer.service';
import { BusinessAreaService } from '../services/business-area.service';
import { HistoryService } from '../services/history.service';
import { ColumnService } from '../services/column.service';
import { DataRoomService } from '../services/data-room.service';
import { ApplySeminarDto } from 'src/libs/dto/training-seminar/apply-seminar.dto';

@ApiTags('Content')
@Controller()
export class PublicContentController {
  constructor(
    private readonly taxMemberService: TaxMemberService,
    private readonly awardService: AwardService,
    private readonly trainingSeminarService: TrainingSeminarService,
    private readonly bannerService: MainBannerService,
    private readonly branchService: BranchService,
    private readonly keyCustomerService: KeyCustomerService,
    private readonly businessAreaService: BusinessAreaService,
    private readonly historyService: HistoryService,
    private readonly columnService: ColumnService,
    private readonly dataRoomService: DataRoomService,
  ) {}

  // ===== MEMBERS (구성원) =====

  @ApiOperation({ summary: '구성원 목록 조회 (공개)' })
  @ApiResponse({ status: 200, description: '구성원 목록 조회 성공' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'search', required: false, type: String, description: '이름 또는 소속명으로 검색' })
  @ApiQuery({ name: 'workArea', required: false, type: String, description: '업무 분야로 필터링' })
  @ApiQuery({ name: 'sort', required: false, enum: ['latest', 'oldest', 'order'], description: '정렬 방식 (기본: order)' })
  @Get('members')
  async getMembers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('workArea') workArea?: string,
    @Query('sort') sort?: 'latest' | 'oldest' | 'order',
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    return this.taxMemberService.findAll({
      page: pageNum,
      limit: limitNum,
      search,
      workArea,
      isExposed: true, // Only exposed members
      sort: sort || 'order',
      includeHidden: false,
    });
  }

  @ApiOperation({ summary: '구성원 상세 조회 (공개)' })
  @ApiResponse({ status: 200, description: '구성원 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '구성원을 찾을 수 없습니다' })
  @Get('members/:id')
  async getMemberDetail(@Param('id', ParseIntPipe) id: number) {
    const member = await this.taxMemberService.findById(id);
    // Only return if exposed
    if (!member.isExposed) {
      throw new NotFoundException('구성원을 찾을 수 없습니다.');
    }
    return member;
  }

  // ===== AWARDS (수상/인증) =====

  @ApiOperation({ summary: '수상/인증 목록 조회 (공개)' })
  @ApiResponse({ status: 200, description: '수상/인증 목록 조회 성공' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'isMainExposed', required: false, type: Boolean, description: '메인 노출 여부로 필터링' })
  @ApiQuery({ name: 'sort', required: false, enum: ['latest', 'oldest', 'order'], description: '정렬 방식 (기본: latest)' })
  @Get('awards')
  async getAwards(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isMainExposed') isMainExposed?: string,
    @Query('sort') sort?: 'latest' | 'oldest' | 'order',
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const isMainExposedBool = isMainExposed === 'true' ? true : isMainExposed === 'false' ? false : undefined;

    return this.awardService.findAllAwardsPublic({
      page: pageNum,
      limit: limitNum,
      isMainExposed: isMainExposedBool,
      sort: sort || 'latest',
    });
  }

  @ApiOperation({ summary: '수상/인증 상세 조회 (공개)' })
  @ApiResponse({ status: 200, description: '수상/인증 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '수상/인증을 찾을 수 없습니다' })
  @Get('awards/:id')
  async getAwardDetail(@Param('id', ParseIntPipe) id: number) {
    const award = await this.awardService.findAwardById(id);
    // Only return if exposed
    if (!award.isExposed) {
      throw new NotFoundException('수상/인증을 찾을 수 없습니다.');
    }
    return award;
  }


  // ===== TRAINING/SEMINAR (교육/세미나) =====

  @ApiOperation({ summary: '교육/세미나 목록 조회 (공개)' })
  @ApiResponse({ status: 200, description: '교육/세미나 목록 조회 성공' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'search', required: false, type: String, description: '제목으로 검색' })
  @ApiQuery({ name: 'type', required: false, enum: ['VOD', 'SEMINAR', 'TRAINING', 'LECTURE'], description: '교육/세미나 유형 필터링' })
  @ApiQuery({ name: 'sort', required: false, enum: ['latest', 'oldest'], description: '정렬 방식 (기본: latest)' })
  @Get('training-seminars')
  async getTrainingSeminars(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('sort') sort?: 'latest' | 'oldest',
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    return this.trainingSeminarService.findAll({
      page: pageNum,
      limit: limitNum,
      search,
      type: type as any,
      isExposed: true, // Only exposed training/seminars
      sort: sort || 'latest',
      includeHidden: false,
    });
  }

  @ApiOperation({ summary: '교육/세미나 상세 조회 (공개)' })
  @ApiResponse({ status: 200, description: '교육/세미나 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '교육/세미나를 찾을 수 없습니다' })
  @Get('training-seminars/:id')
  async getTrainingSeminarDetail(@Param('id', ParseIntPipe) id: number) {
    const seminar = await this.trainingSeminarService.findById(id);
    // Only return if exposed
    if (!seminar.isExposed) {
      throw new NotFoundException('교육/세미나를 찾을 수 없습니다.');
    }
    return seminar;
  }

  @ApiOperation({ summary: '교육/세미나 신청' })
  @ApiResponse({ status: 201, description: '교육/세미나 신청 성공' })
  @ApiResponse({ status: 400, description: '신청 실패 (정원 마감, 필수 정보 누락 등)' })
  @ApiResponse({ status: 404, description: '교육/세미나를 찾을 수 없습니다' })
  @Post('training-seminars/:id/apply')
  async applyToSeminar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApplySeminarDto,
  ) {
    // Validate privacy agreement
    if (!dto.privacyAgreed) {
      throw new BadRequestException('개인정보 수집 및 이용에 동의해주세요.');
    }

    // Check if seminar exists and is exposed
    const seminar = await this.trainingSeminarService.findById(id);
    if (!seminar.isExposed) {
      throw new NotFoundException('교육/세미나를 찾을 수 없습니다.');
    }

    // Create application
    const application = await this.trainingSeminarService.createApplication(id, {
      name: dto.name,
      phoneNumber: dto.phoneNumber,
      email: dto.email,
      participationDate: new Date(dto.participationDate),
      participationTime: dto.participationTime,
      attendeeCount: dto.attendeeCount,
      requestDetails: dto.requestDetails,
    });

    return {
      success: true,
      message: '신청이 완료되었습니다.',
      application: {
        id: application.id,
        status: application.status,
        appliedAt: application.appliedAt,
      },
    };
  }


  // ===== BANNERS (메인 배너) =====

  @ApiOperation({ summary: '메인 배너 목록 조회 (공개)' })
  @ApiResponse({ status: 200, description: '메인 배너 목록 조회 성공' })
  @Get('banners')
  async getBanners() {
    return this.bannerService.findAll(false); // Only active banners
  }

  @ApiOperation({ summary: '메인 배너 상세 조회 (공개)' })
  @ApiResponse({ status: 200, description: '메인 배너 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '배너를 찾을 수 없습니다' })
  @Get('banners/:id')
  async getBannerDetail(@Param('id', ParseIntPipe) id: number) {
    const banner = await this.bannerService.findById(id);
    // Only return if active
    if (!banner.isActive) {
      throw new NotFoundException('배너를 찾을 수 없습니다.');
    }
    return banner;
  }

  // ===== BRANCHES (본사/지점) =====

  @ApiOperation({ summary: '본사/지점 목록 조회 (공개)' })
  @ApiResponse({ status: 200, description: '본사/지점 목록 조회 성공' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'search', required: false, type: String, description: '이름으로 검색' })
  @ApiQuery({ name: 'sort', required: false, enum: ['latest', 'oldest', 'order'], description: '정렬 방식 (기본: order)' })
  @Get('branches')
  async getBranches(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: 'latest' | 'oldest' | 'order',
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    return this.branchService.findAll({
      page: pageNum,
      limit: limitNum,
      search,
      isExposed: true, // Only exposed branches
      sort: sort || 'order',
      includeHidden: false,
    });
  }

  @ApiOperation({ summary: '본사/지점 상세 조회 (공개)' })
  @ApiResponse({ status: 200, description: '본사/지점 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '본사/지점을 찾을 수 없습니다' })
  @Get('branches/:id')
  async getBranchDetail(@Param('id', ParseIntPipe) id: number) {
    const branch = await this.branchService.findById(id);
    // Only return if exposed
    if (!branch.isExposed) {
      throw new NotFoundException('본사/지점을 찾을 수 없습니다.');
    }
    return branch;
  }

  // ===== KEY CUSTOMERS (주요 고객) =====

  @ApiOperation({ summary: '주요 고객 목록 조회 (공개)' })
  @ApiResponse({ status: 200, description: '주요 고객 목록 조회 성공' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'isMainExposed', required: false, type: Boolean, description: '메인 노출 여부로 필터링' })
  @ApiQuery({ name: 'sort', required: false, enum: ['latest', 'oldest', 'order'], description: '정렬 방식 (기본: order)' })
  @Get('key-customers')
  async getKeyCustomers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isMainExposed') isMainExposed?: string,
    @Query('sort') sort?: 'latest' | 'oldest' | 'order',
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const isMainExposedBool = isMainExposed === 'true' ? true : isMainExposed === 'false' ? false : undefined;

    return this.keyCustomerService.findAll({
      page: pageNum,
      limit: limitNum,
      isExposed: true, // Only exposed customers
      isMainExposed: isMainExposedBool,
      sort: sort || 'order',
      includeHidden: false,
    });
  }

  @ApiOperation({ summary: '주요 고객 상세 조회 (공개)' })
  @ApiResponse({ status: 200, description: '주요 고객 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '주요 고객을 찾을 수 없습니다' })
  @Get('key-customers/:id')
  async getKeyCustomerDetail(@Param('id', ParseIntPipe) id: number) {
    const customer = await this.keyCustomerService.findById(id);
    // Only return if exposed
    if (!customer.isExposed) {
      throw new NotFoundException('주요 고객을 찾을 수 없습니다.');
    }
    return customer;
  }

  // ===== BUSINESS AREAS (업무분야) =====

  @ApiOperation({ summary: '업무분야 목록 조회 (공개)' })
  @ApiResponse({ status: 200, description: '업무분야 목록 조회 성공' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'search', required: false, type: String, description: '업무분야명으로 검색' })
  @ApiQuery({ name: 'contentType', required: false, enum: ['A', 'B', 'C'], description: '콘텐츠 타입 필터링' })
  @ApiQuery({ name: 'majorCategory', required: false, type: String, description: '대분류 카테고리 필터링' })
  @ApiQuery({ name: 'isMainExposed', required: false, type: Boolean, description: '메인 노출 여부로 필터링' })
  @ApiQuery({ name: 'sort', required: false, enum: ['latest', 'oldest', 'order'], description: '정렬 방식 (기본: order)' })
  @Get('business-areas')
  async getBusinessAreas(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('contentType') contentType?: string,
    @Query('majorCategory') majorCategory?: string,
    @Query('isMainExposed') isMainExposed?: string,
    @Query('sort') sort?: 'latest' | 'oldest' | 'order',
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const isMainExposedBool = isMainExposed === 'true' ? true : isMainExposed === 'false' ? false : undefined;

    return this.businessAreaService.findAll({
      page: pageNum,
      limit: limitNum,
      search,
      contentType: contentType as any,
      majorCategory,
      isExposed: true, // Only exposed business areas
      isMainExposed: isMainExposedBool,
      sort: sort || 'order',
      includeHidden: false,
    });
  }

  @ApiOperation({ summary: '업무분야 상세 조회 (공개)' })
  @ApiResponse({ status: 200, description: '업무분야 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '업무분야를 찾을 수 없습니다' })
  @Get('business-areas/:id')
  async getBusinessAreaDetail(@Param('id', ParseIntPipe) id: number) {
    const area = await this.businessAreaService.findById(id);
    // Only return if exposed
    if (!area.isExposed) {
      throw new NotFoundException('업무분야를 찾을 수 없습니다.');
    }
    return area;
  }

  // ===== HISTORY (연혁) =====

  @ApiOperation({ summary: '연혁 연도 목록 조회 (공개)' })
  @ApiResponse({ status: 200, description: '연혁 연도 목록 조회 성공' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'sort', required: false, enum: ['latest', 'oldest', 'order'], description: '정렬 방식 (기본: order)' })
  @Get('history')
  async getHistory(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: 'latest' | 'oldest' | 'order',
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    return this.historyService.findAllYears({
      page: pageNum,
      limit: limitNum,
      isExposed: true, // Only exposed years
      sort: sort || 'order',
      includeHidden: false,
    });
  }

  @ApiOperation({ summary: '연혁 연도 상세 조회 (항목 포함, 공개)' })
  @ApiResponse({ status: 200, description: '연혁 연도 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '연혁을 찾을 수 없습니다' })
  @Get('history/:id')
  async getHistoryDetail(@Param('id', ParseIntPipe) id: number) {
    const year = await this.historyService.findYearById(id);
    // Only return if exposed
    if (!year.isExposed) {
      throw new NotFoundException('연혁을 찾을 수 없습니다.');
    }
    // Filter out non-exposed items
    if (year.items) {
      year.items = year.items.filter(item => item.isExposed);
    }
    return year;
  }

  // ===== INSIGHTS (인사이트) =====

  @ApiOperation({ summary: '인사이트 카테고리 목록 조회 (공개)' })
  @ApiResponse({ status: 200, description: '인사이트 카테고리 목록 조회 성공' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'search', required: false, type: String, description: '카테고리명으로 검색' })
  @ApiQuery({ name: 'boardType', required: false, enum: ['갤러리', '스니펫', '게시판'], description: '게시판 유형 필터링' })
  @ApiQuery({ name: 'category', required: false, type: String, description: '카테고리명 (지정 시 해당 카테고리의 아이템 목록 반환)' })
  @Get('insights')
  async getInsights(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('boardType') boardType?: string,
    @Query('category') category?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    // category 파라미터가 있으면 해당 카테고리의 아이템 목록 반환
    if (category) {
      if (category === 'column' || category.toLowerCase() === 'column') {
        // Column 카테고리의 아이템 목록 (columns)
        return this.columnService.findAll({
          search,
          page: pageNum,
          limit: limitNum,
          isExposed: true, // Only exposed columns
          includeHidden: false,
        });
      } else {
        // 다른 카테고리의 아이템 목록 (data room contents)
        try {
          const matchingRoom = await this.dataRoomService.findRoomByName(category);
          // 카테고리가 노출되지 않았으면 에러
          if (!matchingRoom.isExposed) {
            throw new NotFoundException(`카테고리 "${category}"를 찾을 수 없습니다.`);
          }
          // 해당 카테고리의 콘텐츠 목록 반환 (노출된 것만)
          return this.dataRoomService.findContents(matchingRoom.id, {
            search,
            page: pageNum,
            limit: limitNum,
            isExposed: true, // Only exposed contents
            includeHidden: false,
          });
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }
          throw new NotFoundException(`카테고리 "${category}"를 찾을 수 없습니다.`);
        }
      }
    }

    // category 파라미터가 없으면 모든 카테고리 목록 반환 (data rooms, 노출된 것만)
    const roomsResult = await this.dataRoomService.findAllRooms({
      search,
      boardType,
      page: pageNum,
      limit: limitNum,
      isExposed: true, // Only exposed categories
      includeHidden: false,
    });

    // Column은 기본 카테고리이므로 목록에 포함
    const shouldIncludeColumn = !search ||
      search.toLowerCase().includes('column') ||
      search.toLowerCase().includes('칼럼');

    if (shouldIncludeColumn && (!boardType || boardType === '갤러리')) {
      // Column 카테고리의 실제 아이템 개수 조회
      const columnCountResult = await this.columnService.findAll({
        isExposed: true,
        includeHidden: false,
        page: 1,
        limit: 1,
      });

      // Column 카테고리 정보 추가
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

  @ApiOperation({ summary: '인사이트 아이템 상세 조회 (공개)' })
  @ApiResponse({ status: 200, description: '인사이트 아이템 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '아이템을 찾을 수 없습니다' })
  @ApiQuery({ name: 'category', required: false, type: String, description: '카테고리명 (column 또는 다른 카테고리명)' })
  @Get('insights/:id')
  async getInsightDetail(
    @Param('id', ParseIntPipe) id: number,
    @Query('category') category?: string,
  ) {
    if (category === 'column' || category?.toLowerCase() === 'column') {
      // Column 아이템 상세
      const column = await this.columnService.findById(id);
      // Only return if exposed
      if (!column.isExposed) {
        throw new NotFoundException('아이템을 찾을 수 없습니다.');
      }
      return column;
    } else if (category) {
      // 다른 카테고리의 아이템 상세 (data room content)
      const content = await this.dataRoomService.findContentById(id);
      // Only return if exposed
      if (!content.isExposed) {
        throw new NotFoundException('아이템을 찾을 수 없습니다.');
      }
      // 카테고리도 노출되어야 함
      if (content.dataRoom && !content.dataRoom.isExposed) {
        throw new NotFoundException('아이템을 찾을 수 없습니다.');
      }
      return content;
    } else {
      // 카테고리 상세 (data room)
      const room = await this.dataRoomService.findRoomById(id);
      // Only return if exposed
      if (!room.isExposed) {
        throw new NotFoundException('카테고리를 찾을 수 없습니다.');
      }
      return room;
    }
  }

  @ApiOperation({ summary: '인사이트 아이템 조회수 증가 (공개)' })
  @ApiResponse({ status: 200, description: '조회수 증가 성공' })
  @ApiResponse({ status: 404, description: '아이템을 찾을 수 없습니다' })
  @ApiQuery({ name: 'category', required: false, type: String, description: '카테고리명 (column은 조회수 없음, 다른 카테고리만)' })
  @Post('insights/:id/increment-view')
  async incrementInsightViewCount(
    @Param('id', ParseIntPipe) id: number,
    @Query('category') category?: string,
  ) {
    // Column은 조회수 기능 없음 (필요시 추가 가능)
    if (category === 'column' || category?.toLowerCase() === 'column') {
      // Column은 조회수 증가 없이 그냥 성공 반환
      return { success: true, message: '조회수가 증가되었습니다.' };
    } else if (category) {
      // 다른 카테고리의 아이템 조회수 증가 (data room content)
      const content = await this.dataRoomService.findContentById(id);
      // Only increment if exposed
      if (!content.isExposed) {
        throw new NotFoundException('아이템을 찾을 수 없습니다.');
      }
      return this.dataRoomService.incrementViewCount(id);
    } else {
      throw new BadRequestException('카테고리 파라미터가 필요합니다.');
    }
  }

}

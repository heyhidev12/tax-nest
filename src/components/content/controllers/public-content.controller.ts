import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  BadRequestException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/components/auth/jwt-auth.guard';
import { TaxMemberService } from '../services/tax-member.service';
import { AwardService } from '../services/award.service';
import { TrainingSeminarService } from '../services/training-seminar.service';
import { MainBannerService } from '../services/main-banner.service';
import { BranchService } from '../services/branch.service';
import { KeyCustomerService } from '../services/key-customer.service';
import { BusinessAreaService } from '../services/business-area.service';
import { HistoryService } from '../services/history.service';
import { InsightsService } from '../services/insights.service';
import { ApplySeminarDto } from 'src/libs/dto/training-seminar/apply-seminar.dto';
import { ExposureSettingsService } from '../services/exposure-settings.service';
import { MembersService } from 'src/components/members/members.service';

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
    private readonly insightsService: InsightsService,
    private readonly exposureSettingsService: ExposureSettingsService,
    private readonly membersService: MembersService,
  ) { }

  // ===== MEMBERS (구성원) =====

  @ApiOperation({ summary: '구성원 목록 조회 (공개)' })
  @ApiResponse({ status: 200, description: '구성원 목록 조회 성공' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'search', required: false, type: String, description: '이름 또는 소속명으로 검색' })
  @ApiQuery({ name: 'workArea', required: false, type: String, description: '업무 분야로 필터링' })
  @ApiQuery({ name: 'sort', required: false, enum: ['latest', 'oldest', 'order'], description: '정렬 방식 (기본: order)' })
  @ApiOperation({ summary: '구성원 목록 조회 (공개)' })
  @ApiResponse({ status: 200, description: '구성원 목록 조회 성공' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'search', required: false, type: String, description: '구성원명 또는 소속명으로 검색' })
  @ApiQuery({ name: 'workArea', required: false, type: String, description: '업무분야명으로 필터링' })
  @ApiQuery({ name: 'businessAreaId', required: false, type: Number, description: '업무분야 항목 ID로 필터링 (해당 업무분야의 minorCategory.name과 일치하는 구성원만 반환)' })
  @ApiQuery({ name: 'sort', required: false, enum: ['latest', 'oldest', 'order'], description: '정렬 방식 (기본: order)' })
  @Get('members')
  async getMembers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('workArea') workArea?: string,
    @Query('businessAreaId') businessAreaId?: string,
    @Query('sort') sort?: 'latest' | 'oldest' | 'order',
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const businessAreaIdNum = businessAreaId ? parseInt(businessAreaId, 10) : undefined;

    return this.taxMemberService.findAll({
      page: pageNum,
      limit: limitNum,
      search,
      workArea,
      businessAreaId: businessAreaIdNum,
      isExposed: true, // Only exposed members
      sort: sort || 'order',
      includeHidden: false,
      isPublic: true,
    });
  }

  @ApiOperation({ summary: '구성원 상세 조회 (공개)' })
  @ApiResponse({ status: 200, description: '구성원 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '구성원을 찾을 수 없습니다' })
  @Get('members/:id')
  async getMemberDetail(@Param('id', ParseIntPipe) id: number) {
    const member = await this.taxMemberService.findById(id, true);
    // Only return if exposed
    if (!member.isExposed) {
      throw new NotFoundException('구성원을 찾을 수 없습니다.');
    }
    return member;
  }

  // ===== HISTORY (연혁) =====

  @ApiOperation({ summary: '연혁 전체 조회 (연도별 그룹화, 공개)' })
  @ApiResponse({ status: 200, description: '연혁 전체 조회 성공 (연도별 그룹화된 데이터)' })
  @Get('history/all')
  async getAllHistory() {
    const [data, isExposed] = await Promise.all([
      this.historyService.getAllHistoryGroupedByYear(),
      this.exposureSettingsService.isHistoryPageExposed(),
    ]);

    return {
      isExposed,
      data: isExposed ? data : [],
    };
  }

  // ===== AWARDS (수상/인증) =====

  @ApiOperation({ summary: '수상/인증 전체 조회 (연도별 그룹화, 공개)' })
  @ApiResponse({ status: 200, description: '수상/인증 전체 조회 성공 (연도별 그룹화된 데이터)' })
  @Get('awards/all')
  async getAllAwards() {
    return this.awardService.getAllAwardsGroupedByYear();
  }

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

    const awardsData = await this.awardService.findAllAwardsPublic({
      page: pageNum,
      limit: limitNum,
      isMainExposed: isMainExposedBool,
      sort: sort || 'latest',
    });

    const isExposed = await this.exposureSettingsService.isAwardsMainExposed();

    return {
      ...awardsData,
      items: isExposed ? awardsData.items : [],
      isExposed,
    };
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
      isPublic: true,
    });
  }

  @ApiOperation({ summary: '교육/세미나 상세 조회 (공개)' })
  @ApiResponse({ status: 200, description: '교육/세미나 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '교육/세미나를 찾을 수 없습니다' })
  @Get('training-seminars/:id')
  async getTrainingSeminarDetail(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    const seminar = await this.trainingSeminarService.findById(id, true);
    // Only return if exposed
    if (!seminar.isExposed) {
      throw new NotFoundException('교육/세미나를 찾을 수 없습니다.');
    }

    // Check if user is authenticated and has confirmed application to expose Vimeo URL
    const userEmail = req.user?.email;
    let vimeoVideoUrl: string | null = null;

    if (userEmail) {
      // Check if user has a confirmed application for this seminar
      const hasConfirmedApplication = seminar.applications?.some(app =>
        app.email === userEmail &&
        app.status === 'CONFIRMED'
      );

      if (hasConfirmedApplication && seminar.vimeoVideoUrl) {
        vimeoVideoUrl = seminar.vimeoVideoUrl;
      }
    }

    return {
      ...seminar,
      vimeoVideoUrl,
    };
  }

  @ApiOperation({ summary: '교육/세미나 신청' })
  @ApiResponse({ status: 201, description: '교육/세미나 신청 성공' })
  @ApiResponse({ status: 400, description: '신청 실패 (정원 마감, 필수 정보 누락 등)' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자 (로그인 필요)' })
  @ApiResponse({ status: 404, description: '교육/세미나를 찾을 수 없습니다' })
  @ApiBody({ type: ApplySeminarDto })
  @ApiBearerAuth('user-auth')
  @UseGuards(JwtAuthGuard)
  @Post('training-seminars/:id/apply')
  async applyToSeminar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApplySeminarDto,
    @Req() req: any,
  ) {
    const userId = req.user.id || req.user.sub;

    // Validate privacy agreement
    if (!dto.privacyAgreed) {
      throw new BadRequestException('개인정보 수집 및 이용에 동의해주세요.');
    }

    // Check if seminar exists and is exposed
    const seminar = await this.trainingSeminarService.findById(id);
    if (!seminar.isExposed) {
      throw new NotFoundException('교육/세미나를 찾을 수 없습니다.');
    }

    // Get user details from MembersService
    const user = await this.membersService.findById(userId);

    // Create application
    const application = await this.trainingSeminarService.createApplication(id, {
      name: user.name,
      phoneNumber: user.phoneNumber,
      email: user.email,
      participationDate: dto.participationDate,
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
      isPublic: true,
    });
  }

  @ApiOperation({ summary: '본사/지점 상세 조회 (공개)' })
  @ApiResponse({ status: 200, description: '본사/지점 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '본사/지점을 찾을 수 없습니다' })
  @Get('branches/:id')
  async getBranchDetail(@Param('id', ParseIntPipe) id: number) {
    const branch = await this.branchService.findById(id, true);
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
      isPublic: true,
    });
  }


  // ===== BUSINESS AREAS (업무분야) =====

  @ApiOperation({ summary: '업무분야 목록 조회 (공개)' })
  @ApiResponse({ status: 200, description: '업무분야 목록 조회 성공' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiOperation({ summary: '업무분야 계층 구조 데이터 조회 (Accordion UI용)', description: 'Major Category별로 그룹화된 계층 구조 데이터 반환' })
  @ApiResponse({ status: 200, description: '계층 구조 데이터 조회 성공' })
  @Get('business-areas/hierarchical')
  getBusinessAreasHierarchical() {
    return this.businessAreaService.getHierarchicalData(true);
  }

  @ApiOperation({ summary: '업무분야 카테고리 목록 조회 (Flattened)' })
  @ApiResponse({ status: 200, description: '카테고리 목록 조회 성공' })
  @ApiQuery({ name: 'memberId', required: false, type: Number, description: '구성원 ID 필터링 (업무분야 우선순위 순 정렬)' })
  @Get('business-areas/categories')
  getBusinessAreasCategories(@Query('memberId') memberId?: string) {
    const memberIdNum = memberId ? parseInt(memberId, 10) : undefined;
    return this.businessAreaService.getFlattenedCategories(memberIdNum);
  }

  @ApiOperation({ summary: '업무분야 목록 조회' })
  @ApiQuery({ name: 'search', required: false, type: String, description: '업무분야명으로 검색' })
  @ApiQuery({ name: 'majorCategoryId', required: false, type: Number, description: 'Major Category ID 필터링' })
  @ApiQuery({ name: 'minorCategoryId', required: false, type: Number, description: 'Minor Category ID 필터링' })
  @ApiQuery({ name: 'memberId', required: false, type: Number, description: '구성원 ID로 필터링 (해당 구성원의 workAreas와 일치하는 minorCategory.name을 가진 업무분야만 반환)' })
  @ApiQuery({ name: 'minorCategoryName', required: false, type: String, description: 'Minor Category 이름으로 직접 필터링' })
  @ApiQuery({ name: 'sort', required: false, enum: ['latest', 'oldest', 'order'], description: '정렬 방식 (기본: order)' })
  @Get('business-areas')
  async getBusinessAreas(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('majorCategoryId') majorCategoryId?: string,
    @Query('minorCategoryId') minorCategoryId?: string,
    @Query('memberId') memberId?: string,
    @Query('minorCategoryName') minorCategoryName?: string,
    @Query('sort') sort?: 'latest' | 'oldest' | 'order',
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const memberIdNum = memberId ? parseInt(memberId, 10) : undefined;

    return this.businessAreaService.findAll({
      page: pageNum,
      limit: limitNum,
      search,
      majorCategoryId: majorCategoryId ? Number(majorCategoryId) : undefined,
      minorCategoryId: minorCategoryId ? Number(minorCategoryId) : undefined,
      memberId: memberIdNum,
      minorCategoryName,
      isExposed: true, // Only exposed business areas
      sort: sort || 'order',
      includeHidden: false,
      isPublic: true,
    });
  }

  @ApiOperation({ summary: '업무분야 상세 조회 (공개)' })
  @ApiResponse({ status: 200, description: '업무분야 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '업무분야를 찾을 수 없습니다' })
  @Get('business-areas/:id')
  async getBusinessAreaDetail(@Param('id', ParseIntPipe) id: number) {
    const area = await this.businessAreaService.findById(id, true);
    // Only return if exposed
    if (!area.isExposed) {
      throw new NotFoundException('업무분야를 찾을 수 없습니다.');
    }
    return area;
  }


  // ===== INSIGHTS (인사이트) =====

  @ApiOperation({ summary: '인사이트 계층 구조 데이터 조회 (Accordion UI용)', description: 'Category별로 그룹화된 계층 구조 데이터 반환' })
  @ApiResponse({ status: 200, description: '계층 구조 데이터 조회 성공' })
  @Get('insights/hierarchical')
  getInsightsHierarchical() {
    return this.insightsService.getHierarchicalData(true);
  }

  @ApiOperation({ summary: '인사이트 목록 조회 (공개, 페이지네이션 및 필터 지원)' })
  @ApiResponse({ status: 200, description: '인사이트 목록 조회 성공' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: '페이지 번호 (기본: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20, description: '페이지당 항목 수 (기본: 20)' })
  @ApiQuery({ name: 'categoryId', required: false, type: Number, description: '카테고리 ID 필터링' })
  @ApiQuery({ name: 'subcategoryId', required: false, type: Number, description: '서브카테고리 ID 필터링' })
  @ApiQuery({ name: 'dataRoom', required: false, enum: ['A', 'B', 'C'], description: '데이터룸 유형 필터링 (A, B, C)' })
  @Get('insights')
  async getInsights(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('categoryId') categoryId?: string,
    @Query('subcategoryId') subcategoryId?: string,
    @Query('dataRoom') dataRoom?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const categoryIdNum = categoryId ? parseInt(categoryId, 10) : undefined;
    const subcategoryIdNum = subcategoryId ? parseInt(subcategoryId, 10) : undefined;

    return this.insightsService.getPublicInsights({
      page: pageNum,
      limit: limitNum,
      categoryId: categoryIdNum,
      subcategoryId: subcategoryIdNum,
      dataRoom,
    });
  }

  @ApiOperation({ summary: '인사이트 상세 조회 (공개)' })
  @ApiResponse({ status: 200, description: '인사이트 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '인사이트를 찾을 수 없습니다' })
  @Get('insights/:id')
  async getInsightDetail(@Param('id', ParseIntPipe) id: number) {
    return this.insightsService.getPublicInsightById(id);
  }

  @ApiOperation({ summary: '인사이트 조회수 증가 (공개)' })
  @ApiResponse({ status: 200, description: '조회수 증가 성공' })
  @ApiResponse({ status: 404, description: '인사이트를 찾을 수 없습니다' })
  @Post('insights/:id/increment-view')
  async incrementInsightViewCount(@Param('id', ParseIntPipe) id: number) {
    return this.insightsService.incrementViewCount(id);
  }

  // ===== INSIGHTS COMMENTS (인사이트 댓글) =====

  @ApiOperation({ summary: '인사이트 댓글 목록 조회 (공개)' })
  @ApiResponse({ status: 200, description: '댓글 목록 조회 성공' })
  @ApiResponse({ status: 404, description: '인사이트를 찾을 수 없습니다' })
  @Get('insights/:id/comments')
  async getInsightComments(@Param('id', ParseIntPipe) id: number) {
    const result = await this.insightsService.getComments(id);
    return {
      ...result,
      items: result.items.map((comment) => ({
        ...comment,
        createdAtFormatted: this.formatCommentDate(comment.createdAt),
      })),
    };
  }

  @ApiOperation({ summary: '인사이트 댓글 작성 (인증 필요)' })
  @ApiResponse({ status: 201, description: '댓글 작성 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiResponse({ status: 404, description: '인사이트를 찾을 수 없습니다' })
  @ApiResponse({ status: 400, description: '댓글 내용이 없거나 댓글 기능이 비활성화되어 있습니다.' })
  @ApiBearerAuth('user-auth')
  @UseGuards(JwtAuthGuard)
  @ApiBody({
    schema: {
      type: 'object',
      required: ['body'],
      properties: {
        body: { type: 'string', description: '댓글 내용' },
      },
    },
  })
  @Post('insights/:id/comments')
  async createInsightComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { body: string },
    @Req() req: any,
  ) {
    if (!body.body || !body.body.trim()) {
      throw new BadRequestException('댓글 내용을 입력해주세요.');
    }

    const memberId = req.user?.sub; // JWT payload에서 member ID 가져오기
    
    // Fetch member to get the actual name (not email or loginId)
    const member = await this.membersService.findById(memberId);
    
    return this.insightsService.createComment(id, {
      body: body.body.trim(),
      memberId,
      authorName: member.name,
    });
  }

  @ApiOperation({ summary: '인사이트 댓글 삭제 (인증 필요, 본인 댓글만)' })
  @ApiResponse({ status: 200, description: '댓글 삭제 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiResponse({ status: 404, description: '댓글을 찾을 수 없습니다' })
  @ApiBearerAuth('user-auth')
  @UseGuards(JwtAuthGuard)
  @Delete('insights/:id/comments/:commentId')
  async deleteInsightComment(
    @Param('id', ParseIntPipe) id: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Req() req: any,
  ) {
    const memberId = req.user?.sub;
    return this.insightsService.deleteComment(commentId, memberId);
  }

  @ApiOperation({ summary: '인사이트 댓글 신고 (인증 필요)' })
  @ApiResponse({ status: 200, description: '댓글 신고 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiResponse({ status: 404, description: '댓글을 찾을 수 없습니다' })
  @ApiResponse({ status: 400, description: '본인의 댓글은 신고할 수 없습니다.' })
  @ApiBearerAuth('user-auth')
  @UseGuards(JwtAuthGuard)
  @Post('insights/:id/comments/:commentId/report')
  async reportInsightComment(
    @Param('id', ParseIntPipe) id: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Req() req: any,
  ) {
    // Get reporter ID from authenticated user (do NOT accept from body)
    const reporterId = req.user?.sub || req.user?.id;
    if (!reporterId) {
      throw new BadRequestException('인증 정보가 없습니다.');
    }

    return this.insightsService.reportComment(commentId, reporterId);
  }

  // 날짜 포맷 헬퍼 (yyyy.MM.dd HH:mm)
  private formatCommentDate(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  }

}

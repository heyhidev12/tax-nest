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
import { ColumnService } from '../services/column.service';
import { TrainingSeminarService } from '../services/training-seminar.service';
import { ApplySeminarDto } from 'src/libs/dto/training-seminar/apply-seminar.dto';

@ApiTags('Content')
@Controller()
export class PublicContentController {
  constructor(
    private readonly taxMemberService: TaxMemberService,
    private readonly awardService: AwardService,
    private readonly columnService: ColumnService,
    private readonly trainingSeminarService: TrainingSeminarService,
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

  // ===== INSIGHTS (인사이트) =====

  @ApiOperation({ summary: '인사이트 목록 조회 (공개)' })
  @ApiResponse({ status: 200, description: '인사이트 목록 조회 성공' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'search', required: false, type: String, description: '제목으로 검색' })
  @ApiQuery({ name: 'categoryName', required: false, type: String, description: '카테고리로 필터링' })
  @ApiQuery({ name: 'isMainExposed', required: false, type: Boolean, description: '메인 노출 여부로 필터링' })
  @ApiQuery({ name: 'sort', required: false, enum: ['latest', 'oldest', 'order'], description: '정렬 방식 (기본: latest)' })
  @Get('insights')
  async getInsights(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('categoryName') categoryName?: string,
    @Query('isMainExposed') isMainExposed?: string,
    @Query('sort') sort?: 'latest' | 'oldest' | 'order',
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const isMainExposedBool = isMainExposed === 'true' ? true : isMainExposed === 'false' ? false : undefined;

    return this.columnService.findAll({
      page: pageNum,
      limit: limitNum,
      search,
      categoryName,
      isExposed: true, // Only exposed insights
      isMainExposed: isMainExposedBool,
      sort: sort || 'latest',
      includeHidden: false,
    });
  }

  @ApiOperation({ summary: '인사이트 상세 조회 (공개)' })
  @ApiResponse({ status: 200, description: '인사이트 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '인사이트를 찾을 수 없습니다' })
  @Get('insights/:id')
  async getInsightDetail(@Param('id', ParseIntPipe) id: number) {
    const insight = await this.columnService.findById(id);
    // Only return if exposed
    if (!insight.isExposed) {
      throw new NotFoundException('인사이트를 찾을 수 없습니다.');
    }
    return insight;
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
}

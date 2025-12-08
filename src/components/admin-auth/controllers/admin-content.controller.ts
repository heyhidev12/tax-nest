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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
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
  @Post('banners')
  createBanner(@Body() body: any) {
    return this.bannerService.create(body);
  }

  @ApiOperation({ summary: '메인 배너 수정' })
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
  @Post('history/years')
  createHistoryYear(@Body() body: { year: number; isExposed?: boolean }) {
    return this.historyService.createYear(body.year, body.isExposed);
  }

  @ApiOperation({ summary: '연혁 연도 수정' })
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
  @Post('history/years/:yearId/items')
  createHistoryItem(
    @Param('yearId', ParseIntPipe) yearId: number,
    @Body() body: { month?: number; content: string; isExposed?: boolean },
  ) {
    return this.historyService.createItem(yearId, body);
  }

  @ApiOperation({ summary: '연혁 항목 수정' })
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
  @Post('awards/years')
  createAwardYear(@Body() body: { year: number; isMainExposed?: boolean; isExposed?: boolean }) {
    return this.awardService.createYear(body.year, body.isMainExposed, body.isExposed);
  }

  @ApiOperation({ summary: '수상/인증 연도 수정' })
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
  @Post('awards/years/:yearId/awards')
  createAward(
    @Param('yearId', ParseIntPipe) yearId: number,
    @Body() body: { name: string; source: string; imageUrl: string; isMainExposed?: boolean; isExposed?: boolean },
  ) {
    return this.awardService.createAward(yearId, body);
  }

  @ApiOperation({ summary: '수상/인증 수정' })
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
  @Post('branches')
  createBranch(@Body() body: any) {
    return this.branchService.create(body);
  }

  @ApiOperation({ summary: '본사/지점 수정' })
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
  @Post('key-customers')
  createKeyCustomer(@Body() body: any) {
    return this.keyCustomerService.create(body);
  }

  @ApiOperation({ summary: '주요 고객 수정' })
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
  @Post('business-areas')
  createBusinessArea(@Body() body: any) {
    return this.businessAreaService.create(body);
  }

  @ApiOperation({ summary: '업무분야 수정' })
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
  @Patch('business-areas/order')
  updateBusinessAreaOrder(@Body() body: { items: { id: number; displayOrder: number }[] }) {
    return this.businessAreaService.updateOrder(body.items);
  }

  // ===== TRAINING/SEMINARS =====
  @ApiOperation({ summary: '교육/세미나 목록 (검색: 이름, 필터: 유형/모집유형/대상회원/노출여부)' })
  @Get('training-seminars')
  listTrainingSeminars(@Query() query: any) {
    return this.trainingSeminarService.findAll({ ...query, includeHidden: true });
  }

  @ApiOperation({ summary: '교육/세미나 상세' })
  @Get('training-seminars/:id')
  getTrainingSeminar(@Param('id', ParseIntPipe) id: number) {
    return this.trainingSeminarService.findById(id);
  }

  @ApiOperation({ summary: '교육/세미나 생성' })
  @Post('training-seminars')
  createTrainingSeminar(@Body() body: any) {
    return this.trainingSeminarService.create(body);
  }

  @ApiOperation({ summary: '교육/세미나 수정' })
  @Patch('training-seminars/:id')
  updateTrainingSeminar(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.trainingSeminarService.update(id, body);
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
  @Post('columns')
  createColumn(@Body() body: any) {
    return this.columnService.create(body);
  }

  @ApiOperation({ summary: '칼럼 수정' })
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
  @Post('data-rooms')
  createDataRoom(@Body() body: any) {
    return this.dataRoomService.createRoom(body);
  }

  @ApiOperation({ summary: '자료실 수정' })
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
  @Post('data-rooms/:id/contents')
  createDataRoomContent(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.dataRoomService.createContent(id, body);
  }

  @ApiOperation({ summary: '자료실 콘텐츠 수정' })
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
  @Post('categories/major')
  createMajorCategory(@Body() body: { name: string; isExposed?: boolean }) {
    return this.categoryService.createMajor(body.name, body.isExposed);
  }

  @ApiOperation({ summary: '대분류 카테고리 수정' })
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
  @Post('categories/major/:majorId/minor')
  createMinorCategory(@Param('majorId', ParseIntPipe) majorId: number, @Body() body: { name: string; isExposed?: boolean }) {
    return this.categoryService.createMinor(majorId, body.name, body.isExposed);
  }

  @ApiOperation({ summary: '중분류 카테고리 수정' })
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
  @Patch('categories/minor/order')
  updateMinorCategoryOrder(@Body() body: { items: { id: number; displayOrder: number }[] }) {
    return this.categoryService.updateMinorOrder(body.items);
  }

  // ===== TAX MEMBERS (세무사 회원 프로필) =====
  @ApiOperation({ summary: '세무사 회원 목록 (검색: 보험사명/회원명, 필터: 업무분야/노출여부)' })
  @Get('tax-members')
  listTaxMembers(@Query() query: any) {
    return this.taxMemberService.findAll({ ...query, includeHidden: true });
  }

  @ApiOperation({ summary: '세무사 회원 상세' })
  @Get('tax-members/:id')
  getTaxMember(@Param('id', ParseIntPipe) id: number) {
    return this.taxMemberService.findById(id);
  }

  @ApiOperation({ summary: '세무사 회원 생성' })
  @Post('tax-members')
  createTaxMember(@Body() body: any) {
    return this.taxMemberService.create(body);
  }

  @ApiOperation({ summary: '세무사 회원 수정' })
  @Patch('tax-members/:id')
  updateTaxMember(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.taxMemberService.update(id, body);
  }

  @ApiOperation({ summary: '세무사 회원 삭제' })
  @Delete('tax-members/:id')
  deleteTaxMember(@Param('id', ParseIntPipe) id: number) {
    return this.taxMemberService.delete(id);
  }

  @ApiOperation({ summary: '세무사 회원 다중 삭제' })
  @Delete('tax-members/bulk')
  deleteTaxMembers(@Body() dto: AdminDeleteManyDto) {
    return this.taxMemberService.deleteMany(dto.ids);
  }

  @ApiOperation({ summary: '세무사 회원 노출 토글' })
  @Patch('tax-members/:id/toggle-exposure')
  toggleTaxMemberExposure(@Param('id', ParseIntPipe) id: number) {
    return this.taxMemberService.toggleExposure(id);
  }

  @ApiOperation({ summary: '세무사 회원 순서 변경' })
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
  @Patch('exposure-settings/:key')
  updateExposureSetting(@Param('key') key: string, @Body() body: { value: any }) {
    return this.exposureSettingsService.set(key, body.value);
  }

  @ApiOperation({ summary: 'Awards 메인 노출 설정 (Y/N, 기본: N)' })
  @Patch('exposure-settings/awards-main')
  setAwardsMainExposure(@Body() body: { exposed: boolean }) {
    return this.exposureSettingsService.setAwardsMainExposed(body.exposed);
  }

  @ApiOperation({ summary: 'Newsletter 페이지 노출 설정 (Y/N, 기본: N)' })
  @Patch('exposure-settings/newsletter-page')
  setNewsletterPageExposure(@Body() body: { exposed: boolean }) {
    return this.exposureSettingsService.setNewsletterPageExposed(body.exposed);
  }

  @ApiOperation({ summary: 'History 페이지 노출 설정 (Y/N, 기본: N)' })
  @Patch('exposure-settings/history-page')
  setHistoryPageExposure(@Body() body: { exposed: boolean }) {
    return this.exposureSettingsService.setHistoryPageExposed(body.exposed);
  }
}

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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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
  listHistoryYears() {
    return this.historyService.findAllYears(true);
  }

  @ApiOperation({ summary: '연혁 연도 생성' })
  @Post('history/years')
  createHistoryYear(@Body() body: { year: number }) {
    return this.historyService.createYear(body.year);
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

  @ApiOperation({ summary: '연혁 항목 생성' })
  @Post('history/years/:yearId/items')
  createHistoryItem(
    @Param('yearId', ParseIntPipe) yearId: number,
    @Body() body: { month?: number; content: string },
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

  // ===== AWARDS =====
  @ApiOperation({ summary: '수상/인증 연도 목록' })
  @Get('awards/years')
  listAwardYears() {
    return this.awardService.findAllYears(true);
  }

  @ApiOperation({ summary: '수상/인증 연도 생성' })
  @Post('awards/years')
  createAwardYear(@Body() body: { year: number }) {
    return this.awardService.createYear(body.year);
  }

  @ApiOperation({ summary: '수상/인증 연도 삭제' })
  @Delete('awards/years/:id')
  deleteAwardYear(@Param('id', ParseIntPipe) id: number) {
    return this.awardService.deleteYear(id);
  }

  @ApiOperation({ summary: '수상/인증 목록 (연도별)' })
  @Get('awards/years/:yearId/awards')
  listAwards(@Param('yearId', ParseIntPipe) yearId: number) {
    return this.awardService.findAwardsByYear(yearId, true);
  }

  @ApiOperation({ summary: '수상/인증 생성' })
  @Post('awards/years/:yearId/awards')
  createAward(
    @Param('yearId', ParseIntPipe) yearId: number,
    @Body() body: { name: string; source: string; imageUrl: string },
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

  // ===== BRANCHES =====
  @ApiOperation({ summary: '본사/지점 목록' })
  @Get('branches')
  listBranches() {
    return this.branchService.findAll(true);
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

  @ApiOperation({ summary: '본사/지점 순서 변경' })
  @Patch('branches/order')
  updateBranchOrder(@Body() body: { items: { id: number; displayOrder: number }[] }) {
    return this.branchService.updateOrder(body.items);
  }

  // ===== KEY CUSTOMERS =====
  @ApiOperation({ summary: '주요 고객 목록' })
  @Get('key-customers')
  listKeyCustomers() {
    return this.keyCustomerService.findAll(true);
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

  @ApiOperation({ summary: '주요 고객 순서 변경' })
  @Patch('key-customers/order')
  updateKeyCustomerOrder(@Body() body: { items: { id: number; displayOrder: number }[] }) {
    return this.keyCustomerService.updateOrder(body.items);
  }

  // ===== BUSINESS AREAS =====
  @ApiOperation({ summary: '업무분야 목록' })
  @Get('business-areas')
  listBusinessAreas(@Query() query: any) {
    return this.businessAreaService.findAll({ ...query, includeHidden: true });
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

  // ===== TRAINING/SEMINARS =====
  @ApiOperation({ summary: '교육/세미나 목록' })
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

  @ApiOperation({ summary: '교육/세미나 신청 목록' })
  @Get('training-seminars/:id/applications')
  listApplications(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.trainingSeminarService.findApplications(id, Number(page), Number(limit));
  }

  // ===== COLUMNS =====
  @ApiOperation({ summary: '칼럼 목록' })
  @Get('columns')
  listColumns(@Query() query: any) {
    return this.columnService.findAll({ ...query, includeHidden: true });
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

  // ===== DATA ROOMS =====
  @ApiOperation({ summary: '자료실 목록' })
  @Get('data-rooms')
  listDataRooms() {
    return this.dataRoomService.findAllRooms(true);
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

  @ApiOperation({ summary: '자료실 콘텐츠 목록' })
  @Get('data-rooms/:id/contents')
  listDataRoomContents(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.dataRoomService.findContents(id, Number(page), Number(limit), true);
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

  // ===== CATEGORIES =====
  @ApiOperation({ summary: '대분류 카테고리 목록' })
  @Get('categories/major')
  listMajorCategories() {
    return this.categoryService.findAllMajor(true);
  }

  @ApiOperation({ summary: '대분류 카테고리 생성' })
  @Post('categories/major')
  createMajorCategory(@Body() body: { name: string }) {
    return this.categoryService.createMajor(body.name);
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

  @ApiOperation({ summary: '중분류 카테고리 목록' })
  @Get('categories/major/:majorId/minor')
  listMinorCategories(@Param('majorId', ParseIntPipe) majorId: number) {
    return this.categoryService.findMinorsByMajor(majorId, true);
  }

  @ApiOperation({ summary: '중분류 카테고리 생성' })
  @Post('categories/major/:majorId/minor')
  createMinorCategory(@Param('majorId', ParseIntPipe) majorId: number, @Body() body: { name: string }) {
    return this.categoryService.createMinor(majorId, body.name);
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

  // ===== TAX MEMBERS (세무사 회원 프로필) =====
  @ApiOperation({ summary: '세무사 회원 목록' })
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

  // ===== EXPOSURE SETTINGS =====
  @ApiOperation({ summary: '노출 설정 조회' })
  @Get('exposure-settings')
  getExposureSettings() {
    return this.exposureSettingsService.getAll();
  }

  @ApiOperation({ summary: '노출 설정 수정' })
  @Patch('exposure-settings/:key')
  updateExposureSetting(@Param('key') key: string, @Body() body: { value: any }) {
    return this.exposureSettingsService.set(key, body.value);
  }
}


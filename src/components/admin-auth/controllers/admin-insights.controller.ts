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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody, ApiParam } from '@nestjs/swagger';
import { AdminBaseController } from './admin-base.controller';
import { InsightsService } from 'src/components/content/services/insights.service';
import { CreateCategoryDto } from 'src/libs/dto/insights/create-category.dto';
import { UpdateCategoryDto } from 'src/libs/dto/insights/update-category.dto';
import { CreateSubcategoryDto } from 'src/libs/dto/insights/create-subcategory.dto';
import { UpdateSubcategoryDto } from 'src/libs/dto/insights/update-subcategory.dto';
import { CreateItemDto } from 'src/libs/dto/insights/create-item.dto';
import { UpdateItemDto } from 'src/libs/dto/insights/update-item.dto';
import { CategoryResponseDto } from 'src/libs/dto/insights/category-response.dto';
import { ItemResponseDto } from 'src/libs/dto/insights/item-response.dto';

@ApiTags('Admin Content')
@Controller('admin/insights')
export class AdminInsightsController extends AdminBaseController {
  constructor(private readonly insightsService: InsightsService) {
    super();
  }

  // ========== CATEGORY ENDPOINTS ==========

  @ApiOperation({ summary: '카테고리 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '카테고리 목록 조회 성공',
    type: [CategoryResponseDto],
  })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean, description: '비활성화된 항목 포함 여부' })
  @Get('categories')
  listCategories(@Query('includeInactive') includeInactive?: string) {
    return this.insightsService.findAllCategories(includeInactive === 'true');
  }

  @ApiOperation({ summary: '카테고리 상세 조회' })
  @ApiResponse({
    status: 200,
    description: '카테고리 상세 조회 성공',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: '카테고리를 찾을 수 없습니다.' })
  @Get('categories/:id')
  getCategory(@Param('id', ParseIntPipe) id: number) {
    return this.insightsService.findCategoryById(id, true);
  }

  @ApiOperation({
    summary: '카테고리 생성',
    description: '카테고리를 생성합니다. (서브카테고리는 전역으로 관리됩니다)',
  })
  @ApiResponse({
    status: 201,
    description: '카테고리 생성 성공',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 400, description: '입력값 검증 실패' })
  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.insightsService.createCategory(dto);
  }

  @ApiOperation({ summary: '카테고리 수정' })
  @ApiResponse({ status: 200, description: '카테고리 수정 성공' })
  @ApiResponse({ status: 404, description: '카테고리를 찾을 수 없습니다.' })
  @Patch('categories/:id')
  updateCategory(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto) {
    return this.insightsService.updateCategory(id, dto);
  }

  @ApiOperation({ summary: '카테고리 활성화/비활성화' })
  @ApiResponse({ status: 200, description: '카테고리 활성화 상태 변경 성공' })
  @ApiResponse({ status: 404, description: '카테고리를 찾을 수 없습니다.' })
  @Patch('categories/:id/toggle-active')
  toggleCategoryActive(@Param('id', ParseIntPipe) id: number) {
    return this.insightsService.toggleCategoryActive(id);
  }

  @ApiOperation({ summary: '카테고리 삭제', description: '아이템에서 사용 중인 경우 삭제할 수 없습니다.' })
  @ApiResponse({ status: 200, description: '카테고리 삭제 성공' })
  @ApiResponse({ status: 400, description: '사용 중인 카테고리는 삭제할 수 없습니다.' })
  @ApiResponse({ status: 404, description: '카테고리를 찾을 수 없습니다.' })
  @Delete('categories/:id')
  deleteCategory(@Param('id', ParseIntPipe) id: number) {
    return this.insightsService.deleteCategory(id);
  }

  // ========== SUBCATEGORY ENDPOINTS ==========

  @ApiOperation({ summary: '모든 서브카테고리 조회 (전역)', description: '서브카테고리는 전역으로 관리되며 카테고리와 연결되지 않습니다.' })
  @ApiResponse({ status: 200, description: '서브카테고리 목록 조회 성공' })
  @ApiQuery({ name: 'includeHidden', required: false, type: Boolean, description: '비노출 항목 포함 여부' })
  @Get('subcategories')
  getAllSubcategories(@Query('includeHidden') includeHidden?: string) {
    return this.insightsService.getAllSubcategories(includeHidden === 'true');
  }

  @ApiOperation({ summary: '서브카테고리 상세 조회' })
  @ApiResponse({ status: 200, description: '서브카테고리 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '서브카테고리를 찾을 수 없습니다.' })
  @Get('subcategories/:id')
  getSubcategory(@Param('id', ParseIntPipe) id: number) {
    return this.insightsService.getSubcategoryById(id, true);
  }

  @ApiOperation({
    summary: '서브카테고리 생성',
    description: '전역 서브카테고리를 생성합니다. 섹션 배열(발생원인, 리스크, 체크포인트, 함께 실행방안, 케이스)을 포함해야 합니다.'
  })
  @ApiResponse({ status: 201, description: '서브카테고리 생성 성공' })
  @ApiResponse({ status: 400, description: '입력값 검증 실패' })
  @Post('subcategories')
  createSubcategory(@Body() dto: CreateSubcategoryDto) {
    return this.insightsService.createSubcategory(dto);
  }

  @ApiOperation({ summary: '서브카테고리 수정', description: '서브카테고리 정보 및 섹션 배열을 수정합니다.' })
  @ApiResponse({ status: 200, description: '서브카테고리 수정 성공' })
  @ApiResponse({ status: 400, description: '입력값 검증 실패' })
  @ApiResponse({ status: 404, description: '서브카테고리를 찾을 수 없습니다.' })
  @Patch('subcategories/:id')
  updateSubcategory(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSubcategoryDto) {
    return this.insightsService.updateSubcategory(id, dto);
  }

  @ApiOperation({ summary: '서브카테고리 삭제', description: '아이템에서 사용 중인 경우 삭제할 수 없습니다.' })
  @ApiResponse({ status: 200, description: '서브카테고리 삭제 성공' })
  @ApiResponse({ status: 400, description: '사용 중인 서브카테고리는 삭제할 수 없습니다.' })
  @ApiResponse({ status: 404, description: '서브카테고리를 찾을 수 없습니다.' })
  @Delete('subcategories/:id')
  deleteSubcategory(@Param('id', ParseIntPipe) id: number) {
    return this.insightsService.deleteSubcategory(id);
  }

  @ApiOperation({ summary: '서브카테고리 노출/비노출 토글' })
  @ApiResponse({ status: 200, description: '서브카테고리 노출 상태 변경 성공' })
  @ApiResponse({ status: 404, description: '서브카테고리를 찾을 수 없습니다.' })
  @Patch('subcategories/:id/toggle-exposed')
  toggleSubcategoryExposed(@Param('id', ParseIntPipe) id: number) {
    return this.insightsService.toggleSubcategoryExposed(id);
  }

  // ========== ITEM ENDPOINTS ==========

  @ApiOperation({ summary: '아이템 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '아이템 목록 조회 성공',
    type: [ItemResponseDto],
  })
  @ApiQuery({ name: 'categoryId', required: false, type: Number, description: '카테고리 ID (필터)' })
  @ApiQuery({ name: 'subcategoryId', required: false, type: Number, description: '서브카테고리 ID (필터)' })
  @ApiQuery({ name: 'includeHidden', required: false, type: Boolean, description: '비노출 항목 포함 여부' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '페이지당 항목 수 (기본: 20)' })
  @ApiQuery({ name: 'authorName', required: false, type: String, description: '작성자 이름 검색 (부분 일치, 대소문자 구분 없음)' })
  @Get('items')
  listItems(
    @Query('categoryId') categoryId?: string,
    @Query('subcategoryId') subcategoryId?: string,
    @Query('includeHidden') includeHidden?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('authorName') authorName?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    if (categoryId) {
      const categoryIdNum = Number(categoryId);
      return this.insightsService.getItemsByCategoryAndSubcategory(
        categoryIdNum,
        includeHidden === 'true',
        pageNum,
        limitNum,
        authorName,
      );
    }
    return this.insightsService.getAllItems(includeHidden === 'true', pageNum, limitNum, authorName);
  }

  @ApiOperation({ summary: '아이템 상세 조회' })
  @ApiResponse({
    status: 200,
    description: '아이템 상세 조회 성공',
    type: ItemResponseDto,
  })
  @ApiResponse({ status: 404, description: '아이템을 찾을 수 없습니다.' })
  @Get('items/:id')
  getItem(@Param('id', ParseIntPipe) id: number) {
    return this.insightsService.getItemById(id, true);
  }

  @ApiOperation({
    summary: '아이템 생성',
    description: '아이템을 생성합니다. 카테고리와 서브카테고리는 독립적으로 선택되며, 각각 존재하고 노출 상태여야 합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '아이템 생성 성공',
    type: ItemResponseDto,
  })
  @ApiResponse({ status: 400, description: '입력값 검증 실패' })
  @ApiResponse({ status: 404, description: '카테고리 또는 서브카테고리를 찾을 수 없습니다.' })
  @Post('items')
  createItem(@Body() dto: CreateItemDto, @Req() req: any) {
    const adminId = req.user?.id;
    return this.insightsService.createItem(dto, adminId);
  }

  @ApiOperation({
    summary: '아이템 수정',
    description: '아이템을 수정합니다. 카테고리나 서브카테고리를 변경할 경우 각각 존재하고 노출 상태여야 합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '아이템 수정 성공',
    type: ItemResponseDto,
  })
  @ApiResponse({ status: 400, description: '입력값 검증 실패' })
  @ApiResponse({ status: 404, description: '아이템, 카테고리 또는 서브카테고리를 찾을 수 없습니다.' })
  @Patch('items/:id')
  updateItem(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateItemDto) {
    return this.insightsService.updateItem(id, dto);
  }

  @ApiOperation({ summary: '아이템 삭제' })
  @ApiResponse({ status: 200, description: '아이템 삭제 성공' })
  @ApiResponse({ status: 404, description: '아이템을 찾을 수 없습니다.' })
  @Delete('items/:id')
  deleteItem(@Param('id', ParseIntPipe) id: number) {
    return this.insightsService.deleteItem(id);
  }
}


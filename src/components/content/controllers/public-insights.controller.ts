import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { InsightsService } from '../services/insights.service';
import { CategoryResponseDto } from 'src/libs/dto/insights/category-response.dto';
import { ItemResponseDto } from 'src/libs/dto/insights/item-response.dto';

@ApiTags('Insights')
@Controller('insights')
export class PublicInsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @ApiOperation({ summary: '모든 카테고리 조회' })
  @ApiResponse({
    status: 200,
    description: '카테고리 목록 조회 성공',
    type: [CategoryResponseDto],
  })
  @Get('categories')
  getCategories() {
    return this.insightsService.findAllCategories(false);
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
    return this.insightsService.findCategoryById(id, false);
  }

  @ApiOperation({ summary: '모든 서브카테고리 조회 (전역)', description: '노출된 모든 전역 서브카테고리를 조회합니다.' })
  @ApiResponse({ status: 200, description: '서브카테고리 목록 조회 성공' })
  @Get('subcategories')
  getSubcategories() {
    return this.insightsService.getAllSubcategories(false);
  }

  @ApiOperation({ summary: '카테고리 및 서브카테고리별 아이템 조회' })
  @ApiResponse({
    status: 200,
    description: '아이템 목록 조회 성공',
    type: [ItemResponseDto],
  })
  @ApiQuery({ name: 'categoryId', required: true, type: Number, description: '카테고리 ID' })
  @ApiQuery({ name: 'subcategoryId', required: false, type: Number, description: '서브카테고리 ID (선택)' })
  @Get('items')
  getItems(
    @Query('categoryId', ParseIntPipe) categoryId: number,
    @Query('subcategoryId') subcategoryId?: number,
  ) {
    const subcategoryIdNum = subcategoryId ? Number(subcategoryId) : undefined;
    return this.insightsService.getItemsByCategoryAndSubcategory(categoryId, subcategoryIdNum, false);
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
    return this.insightsService.getItemById(id, false);
  }
}


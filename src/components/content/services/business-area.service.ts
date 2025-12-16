import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { BusinessArea } from 'src/libs/entity/business-area.entity';
import { BusinessAreaCategory } from 'src/libs/entity/business-area-category.entity';
import { InsightsSubcategory } from 'src/libs/entity/insights-subcategory.entity';
import { CreateBusinessAreaCategoryDto } from 'src/libs/dto/business-area/create-category.dto';
import { UpdateBusinessAreaCategoryDto } from 'src/libs/dto/business-area/update-category.dto';
import { CreateBusinessAreaItemDto } from 'src/libs/dto/business-area/create-item.dto';
import { UpdateBusinessAreaItemDto } from 'src/libs/dto/business-area/update-item.dto';

interface BusinessAreaListOptions {
  search?: string;
  majorCategoryId?: number;
  minorCategoryId?: number;
  isExposed?: boolean;
  isMainExposed?: boolean;
  sort?: 'latest' | 'oldest' | 'order';
  page?: number;
  limit?: number;
  includeHidden?: boolean;
}

@Injectable()
export class BusinessAreaService {
  constructor(
    @InjectRepository(BusinessArea)
    private readonly areaRepo: Repository<BusinessArea>,
    @InjectRepository(BusinessAreaCategory)
    private readonly categoryRepo: Repository<BusinessAreaCategory>,
    @InjectRepository(InsightsSubcategory)
    private readonly insightsSubcategoryRepo: Repository<InsightsSubcategory>,
  ) {}

  // ========== CATEGORY METHODS ==========

  async createCategory(dto: CreateBusinessAreaCategoryDto) {
    // Validate major category exists and is exposed
    const majorCategory = await this.insightsSubcategoryRepo.findOne({
      where: { id: dto.majorCategoryId, isExposed: true },
    });
    if (!majorCategory) {
      throw new NotFoundException('Major Category를 찾을 수 없습니다.');
    }

    const category = this.categoryRepo.create({
      majorCategoryId: dto.majorCategoryId,
      name: dto.name,
      isExposed: dto.isExposed ?? true,
    });

    return this.categoryRepo.save(category);
  }

  async getAllCategories(includeHidden = false) {
    const where = includeHidden ? {} : { isExposed: true };
    const categories = await this.categoryRepo.find({
      where,
      relations: ['majorCategory'],
      order: { createdAt: 'ASC' },
    });

    return categories.map((cat) => ({
      id: cat.id,
      majorCategory: {
        id: cat.majorCategory.id,
        name: cat.majorCategory.name,
        sections: cat.majorCategory.sections || [],
        isExposed: cat.majorCategory.isExposed,
        displayOrder: cat.majorCategory.displayOrder,
      },
      name: cat.name,
      isExposed: cat.isExposed,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }));
  }

  async getCategoriesByMajorCategory(majorCategoryId: number, includeHidden = false) {
    // Validate major category exists
    const majorCategory = await this.insightsSubcategoryRepo.findOne({
      where: { id: majorCategoryId },
    });
    if (!majorCategory) {
      throw new NotFoundException('Major Category를 찾을 수 없습니다.');
    }

    const where: any = { majorCategoryId };
    if (!includeHidden) {
      where.isExposed = true;
    }

    const categories = await this.categoryRepo.find({
      where,
      relations: ['majorCategory'],
      order: { createdAt: 'ASC' },
    });

    return categories.map((cat) => ({
      id: cat.id,
      majorCategory: {
        id: cat.majorCategory.id,
        name: cat.majorCategory.name,
        sections: cat.majorCategory.sections || [],
        isExposed: cat.majorCategory.isExposed,
        displayOrder: cat.majorCategory.displayOrder,
      },
      name: cat.name,
      isExposed: cat.isExposed,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }));
  }

  async getCategoryById(id: number, includeHidden = false) {
    const where: any = { id };
    if (!includeHidden) {
      where.isExposed = true;
    }

    const category = await this.categoryRepo.findOne({
      where,
      relations: ['majorCategory'],
    });

    if (!category) {
      throw new NotFoundException('Category를 찾을 수 없습니다.');
    }

    return {
      id: category.id,
      majorCategory: {
        id: category.majorCategory.id,
        name: category.majorCategory.name,
        sections: category.majorCategory.sections || [],
        isExposed: category.majorCategory.isExposed,
        displayOrder: category.majorCategory.displayOrder,
      },
      name: category.name,
      isExposed: category.isExposed,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  async updateCategory(id: number, dto: UpdateBusinessAreaCategoryDto) {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category를 찾을 수 없습니다.');
    }

    if (dto.name) category.name = dto.name;
    if (dto.isExposed !== undefined) category.isExposed = dto.isExposed;

    return this.categoryRepo.save(category);
  }

  async deleteCategory(id: number) {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category를 찾을 수 없습니다.');
    }

    // Check if category is used by any items
    const itemCount = await this.areaRepo.count({ where: { minorCategoryId: id } });
    if (itemCount > 0) {
      throw new BadRequestException(
        `Category가 ${itemCount}개의 아이템에서 사용 중이어서 삭제할 수 없습니다.`,
      );
    }

    await this.categoryRepo.remove(category);
    return { success: true };
  }

  async toggleCategoryExposure(id: number) {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category를 찾을 수 없습니다.');
    }

    category.isExposed = !category.isExposed;
    await this.categoryRepo.save(category);
    return { success: true, isExposed: category.isExposed };
  }

  /**
   * Get categories grouped by major category for admin UI
   */
  async getCategoriesGroupedByMajor(includeHidden = false) {
    const categories = await this.getAllCategories(includeHidden);
    
    // Group by major category
    const grouped: Record<number, any> = {};
    for (const cat of categories) {
      const majorId = cat.majorCategory.id;
      if (!grouped[majorId]) {
        grouped[majorId] = {
          majorCategory: cat.majorCategory,
          categories: [],
        };
      }
      grouped[majorId].categories.push({
        id: cat.id,
        name: cat.name,
        isExposed: cat.isExposed,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
      });
    }

    return Object.values(grouped);
  }

  // ========== ITEM METHODS ==========

  async createItem(dto: CreateBusinessAreaItemDto) {
    // Validate major category exists and is exposed
    const majorCategory = await this.insightsSubcategoryRepo.findOne({
      where: { id: dto.majorCategory.id, isExposed: true },
    });
    if (!majorCategory) {
      throw new NotFoundException('Major Category를 찾을 수 없습니다.');
    }

    // Validate minor category exists, is exposed, and belongs to the major category
    const minorCategory = await this.categoryRepo.findOne({
      where: { id: dto.minorCategory.id, majorCategoryId: dto.majorCategory.id, isExposed: true },
    });
    if (!minorCategory) {
      throw new BadRequestException('Minor Category를 찾을 수 없거나 선택한 Major Category에 속하지 않습니다.');
    }

    const item = this.areaRepo.create({
      name: dto.name,
      subDescription: dto.subDescription,
      imageUrl: dto.imageUrl,
      majorCategoryId: dto.majorCategory.id,
      minorCategoryId: dto.minorCategory.id,
      overview: dto.overview,
      body: dto.body,
      youtubeUrl: dto.youtubeUrl,
      isMainExposed: dto.isMainExposed ?? false,
      isExposed: dto.isExposed ?? true,
      displayOrder: dto.displayOrder ?? 0,
    });

    const saved = await this.areaRepo.save(item);
    return this.areaRepo.findOne({
      where: { id: saved.id },
      relations: ['majorCategory', 'minorCategory'],
    });
  }

  async findAll(options: BusinessAreaListOptions = {}) {
    const { 
      search, 
      majorCategoryId,
      minorCategoryId,
      isExposed,
      isMainExposed,
      sort = 'order',
      page = 1, 
      limit = 20, 
      includeHidden = false 
    } = options;
    
    const qb = this.areaRepo.createQueryBuilder('area')
      .leftJoinAndSelect('area.majorCategory', 'majorCategory')
      .leftJoinAndSelect('area.minorCategory', 'minorCategory');

    // 노출 여부 필터
    if (!includeHidden) {
      qb.andWhere('area.isExposed = :isExposed', { isExposed: true });
    } else if (isExposed !== undefined) {
      qb.andWhere('area.isExposed = :isExposed', { isExposed });
    }

    // 메인 노출 필터
    if (isMainExposed !== undefined) {
      qb.andWhere('area.isMainExposed = :isMainExposed', { isMainExposed });
    }

    // 대분류 필터
    if (majorCategoryId) {
      qb.andWhere('area.majorCategoryId = :majorCategoryId', { majorCategoryId });
    }

    // 중분류 필터
    if (minorCategoryId) {
      qb.andWhere('area.minorCategoryId = :minorCategoryId', { minorCategoryId });
    }

    // 업무분야명 검색
    if (search) {
      qb.andWhere('area.name LIKE :search', { search: `%${search}%` });
    }

    // 정렬
    if (sort === 'order') {
      qb.orderBy('area.displayOrder', 'ASC').addOrderBy('area.createdAt', 'DESC');
    } else if (sort === 'latest') {
      qb.orderBy('area.createdAt', 'DESC');
    } else {
      qb.orderBy('area.createdAt', 'ASC');
    }

    // 페이지네이션
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    // 응답 포맷: No, 노출순서, 업무분야명, 업무분야(대분류), 업무분야(중분류), Youtube, 메인노출여부, 노출여부, 등록일시
    // 번호는 최신 등록일 기준으로 순차 번호 부여 (등록일 DESC 기준)
    const formattedItems = items.map((item, index) => {
      // 최신순이면 큰 번호부터, 오래된순이면 작은 번호부터
      const no = sort === 'latest' 
        ? total - ((page - 1) * limit + index)
        : (page - 1) * limit + index + 1;

      // YouTube URL 개수 계산 (여러 개일 수 있음 - JSON 배열 또는 콤마 구분)
      let youtubeCount = 0;
      if (item.youtubeUrl) {
        try {
          // JSON 배열인 경우
          const parsed = JSON.parse(item.youtubeUrl);
          youtubeCount = Array.isArray(parsed) ? parsed.length : 1;
        } catch {
          // 콤마 구분 문자열인 경우
          youtubeCount = item.youtubeUrl.split(',').filter(url => url.trim()).length;
        }
      }

      return {
        no,
        id: item.id,
        name: item.name,
        subDescription: item.subDescription,
        majorCategory: item.majorCategory
          ? {
              id: item.majorCategory.id,
              name: item.majorCategory.name,
              sections: item.majorCategory.sections || [],
              isExposed: item.majorCategory.isExposed,
              displayOrder: item.majorCategory.displayOrder,
            }
          : null,
        minorCategory: item.minorCategory
          ? {
              id: item.minorCategory.id,
              name: item.minorCategory.name,
              isExposed: item.minorCategory.isExposed,
            }
          : null,
        imageUrl: item.imageUrl,
        youtubeUrl: item.youtubeUrl,
        youtubeCount,
        displayOrder: item.displayOrder,
        isMainExposed: item.isMainExposed,
        mainExposedLabel: item.isMainExposed ? 'Y' : 'N',
        isExposed: item.isExposed,
        exposedLabel: item.isExposed ? 'Y' : 'N',
        createdAt: item.createdAt,
        createdAtFormatted: this.formatDateTime(item.createdAt),
      };
    });

    return { items: formattedItems, total, page, limit };
  }

  async findMainExposed() {
    return this.areaRepo.find({
      where: { isExposed: true, isMainExposed: true },
      order: { displayOrder: 'ASC' },
    });
  }

  async findById(id: number) {
    const area = await this.areaRepo.findOne({
      where: { id },
      relations: ['majorCategory', 'minorCategory'],
    });
    if (!area) throw new NotFoundException('업무분야를 찾을 수 없습니다.');
    
    return {
      id: area.id,
      name: area.name,
      subDescription: area.subDescription,
      imageUrl: area.imageUrl,
      majorCategory: area.majorCategory
        ? {
            id: area.majorCategory.id,
            name: area.majorCategory.name,
            sections: area.majorCategory.sections || [],
            isExposed: area.majorCategory.isExposed,
            displayOrder: area.majorCategory.displayOrder,
          }
        : null,
      minorCategory: area.minorCategory
        ? {
            id: area.minorCategory.id,
            name: area.minorCategory.name,
            isExposed: area.minorCategory.isExposed,
          }
        : null,
      overview: area.overview,
      body: area.body,
      youtubeUrl: area.youtubeUrl,
      isMainExposed: area.isMainExposed,
      isExposed: area.isExposed,
      displayOrder: area.displayOrder,
      createdAt: area.createdAt,
      updatedAt: area.updatedAt,
      mainExposedLabel: area.isMainExposed ? 'Y' : 'N',
      exposedLabel: area.isExposed ? 'Y' : 'N',
      createdAtFormatted: this.formatDateTime(area.createdAt),
      updatedAtFormatted: this.formatDateTime(area.updatedAt),
    };
  }

  async updateItem(id: number, dto: UpdateBusinessAreaItemDto) {
    const item = await this.areaRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('업무분야를 찾을 수 없습니다.');
    }

    // If major category is being updated, validate it exists
    if (dto.majorCategory) {
      const majorCategory = await this.insightsSubcategoryRepo.findOne({
        where: { id: dto.majorCategory.id, isExposed: true },
      });
      if (!majorCategory) {
        throw new NotFoundException('Major Category를 찾을 수 없습니다.');
      }
      item.majorCategoryId = dto.majorCategory.id;
    }

    // If minor category is being updated, validate it exists and belongs to major category
    if (dto.minorCategory) {
      const majorCategoryId = dto.majorCategory?.id ?? item.majorCategoryId;
      const minorCategory = await this.categoryRepo.findOne({
        where: { id: dto.minorCategory.id, majorCategoryId, isExposed: true },
      });
      if (!minorCategory) {
        throw new BadRequestException('Minor Category를 찾을 수 없거나 선택한 Major Category에 속하지 않습니다.');
      }
      item.minorCategoryId = dto.minorCategory.id;
    }

    if (dto.name) item.name = dto.name;
    if (dto.subDescription !== undefined) item.subDescription = dto.subDescription;
    if (dto.imageUrl) item.imageUrl = dto.imageUrl;
    if (dto.overview) item.overview = dto.overview;
    if (dto.body) item.body = dto.body;
    if (dto.youtubeUrl !== undefined) item.youtubeUrl = dto.youtubeUrl;
    if (dto.isMainExposed !== undefined) item.isMainExposed = dto.isMainExposed;
    if (dto.isExposed !== undefined) item.isExposed = dto.isExposed;
    if (dto.displayOrder !== undefined) item.displayOrder = dto.displayOrder;

    await this.areaRepo.save(item);
    return this.areaRepo.findOne({
      where: { id: item.id },
      relations: ['majorCategory', 'minorCategory'],
    });
  }

  async delete(id: number) {
    const area = await this.areaRepo.findOne({ where: { id } });
    if (!area) throw new NotFoundException('업무분야를 찾을 수 없습니다.');
    await this.areaRepo.remove(area);
    return { success: true, message: '삭제가 완료되었습니다.' };
  }

  async deleteMany(ids: number[]) {
    const areas = await this.areaRepo.find({ where: { id: In(ids) } });
    if (!areas.length) return { success: true, deleted: 0 };
    await this.areaRepo.remove(areas);
    return { success: true, deleted: areas.length, message: '삭제가 완료되었습니다.' };
  }

  async toggleExposure(id: number) {
    const area = await this.areaRepo.findOne({ where: { id } });
    if (!area) throw new NotFoundException('업무분야를 찾을 수 없습니다.');
    area.isExposed = !area.isExposed;
    await this.areaRepo.save(area);
    return { success: true, isExposed: area.isExposed };
  }

  async toggleMainExposure(id: number) {
    const area = await this.areaRepo.findOne({ where: { id } });
    if (!area) throw new NotFoundException('업무분야를 찾을 수 없습니다.');
    area.isMainExposed = !area.isMainExposed;
    await this.areaRepo.save(area);
    return { success: true, isMainExposed: area.isMainExposed };
  }

  async updateOrder(items: { id: number; displayOrder: number }[]) {
    for (const item of items) {
      await this.areaRepo.update(item.id, { displayOrder: item.displayOrder });
    }
    return { success: true };
  }

  /**
   * Get hierarchical data for public frontend (accordion-style UI)
   * Groups items by major category and then by minor category
   */
  async getHierarchicalData(includeHidden = false) {
    const where = includeHidden ? {} : { isExposed: true };
    const items = await this.areaRepo.find({
      where,
      relations: ['majorCategory', 'minorCategory'],
      order: {
        majorCategoryId: 'ASC',
        minorCategoryId: 'ASC',
        displayOrder: 'ASC',
        createdAt: 'DESC',
      },
    });

    // Group by major category, then by minor category
    const grouped: Record<number, any> = {};

    for (const item of items) {
      const majorId = item.majorCategoryId;
      const minorId = item.minorCategoryId;

      if (!grouped[majorId]) {
        grouped[majorId] = {
          majorCategory: {
            id: item.majorCategory.id,
            name: item.majorCategory.name,
            sections: item.majorCategory.sections || [],
            isExposed: item.majorCategory.isExposed,
            displayOrder: item.majorCategory.displayOrder,
          },
          minorCategories: {},
        };
      }

      if (!grouped[majorId].minorCategories[minorId]) {
        grouped[majorId].minorCategories[minorId] = {
          id: item.minorCategory.id,
          name: item.minorCategory.name,
          isExposed: item.minorCategory.isExposed,
          items: [],
        };
      }

      grouped[majorId].minorCategories[minorId].items.push({
        id: item.id,
        name: item.name,
        subDescription: item.subDescription,
        imageUrl: item.imageUrl,
        overview: item.overview,
        body: item.body,
        youtubeUrl: item.youtubeUrl,
        isMainExposed: item.isMainExposed,
        isExposed: item.isExposed,
        displayOrder: item.displayOrder,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });
    }

    // Convert to array format
    return Object.values(grouped).map((group) => ({
      majorCategory: group.majorCategory,
      minorCategories: Object.values(group.minorCategories),
    }));
  }

  // 날짜 포맷 헬퍼 (yyyy.MM.dd HH:mm:ss)
  private formatDateTime(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`;
  }
}

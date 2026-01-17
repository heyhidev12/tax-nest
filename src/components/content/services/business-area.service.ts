import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { BusinessArea } from 'src/libs/entity/business-area.entity';
import { BusinessAreaCategory } from 'src/libs/entity/business-area-category.entity';
import { InsightsSubcategory } from 'src/libs/entity/insights-subcategory.entity';
import { TaxMember } from 'src/libs/entity/tax-member.entity';
import { CreateBusinessAreaCategoryDto } from 'src/libs/dto/business-area/create-category.dto';
import { UpdateBusinessAreaCategoryDto } from 'src/libs/dto/business-area/update-category.dto';
import { CreateBusinessAreaItemDto } from 'src/libs/dto/business-area/create-item.dto';
import { UpdateBusinessAreaItemDto } from 'src/libs/dto/business-area/update-item.dto';

interface BusinessAreaListOptions {
  search?: string;
  majorCategoryId?: number;
  minorCategoryId?: number;
  memberId?: number; // Filter by member ID (matches minorCategory.name with member workAreas)
  minorCategoryName?: string; // Filter by minor category name directly
  isExposed?: boolean;
  sort?: 'latest' | 'oldest' | 'order';
  page?: number;
  limit?: number;
  includeHidden?: boolean;
  isPublic?: boolean;
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
    @InjectRepository(TaxMember)
    private readonly taxMemberRepo: Repository<TaxMember>,
    private readonly dataSource: DataSource,
  ) { }

  // ========== HELPER METHODS ==========

  /**
   * Format category response to include image and isMainExposed
   */
  private formatCategoryResponse(cat: BusinessAreaCategory) {
    return {
      id: cat.id,
      majorCategory: {
        id: cat.majorCategory.id,
        name: cat.majorCategory.name,
        sections: cat.majorCategory.sections || [],
        isExposed: cat.majorCategory.isExposed,
        displayOrder: cat.majorCategory.displayOrder,
      },
      name: cat.name,
      image: cat.image,
      isExposed: cat.isExposed,
      isMainExposed: cat.isMainExposed,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    };
  }

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
      image: dto.image,
      isExposed: dto.isExposed ?? true,
      isMainExposed: dto.isMainExposed ?? false,
    });

    const saved = await this.categoryRepo.save(category);
    
    // Reload with relations to ensure majorCategory is available
    const created = await this.categoryRepo.findOne({
      where: { id: saved.id },
      relations: ['majorCategory'],
    });
    
    // Return with proper format including image and isMainExposed
    return this.formatCategoryResponse(created!);
  }

  async getAllCategories(includeHidden = false) {
    const where = includeHidden ? {} : { isExposed: true };
    const categories = await this.categoryRepo.find({
      where,
      relations: ['majorCategory'],
      order: { createdAt: 'ASC' },
    });

    return categories.map((cat) => this.formatCategoryResponse(cat));
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

    return categories.map((cat) => this.formatCategoryResponse(cat));
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

    return this.formatCategoryResponse(category);
  }

  async updateCategory(id: number, dto: UpdateBusinessAreaCategoryDto) {
    const category = await this.categoryRepo.findOne({ 
      where: { id },
      relations: ['majorCategory'],
    });
    if (!category) {
      throw new NotFoundException('Category를 찾을 수 없습니다.');
    }

    if (dto.name) category.name = dto.name;
    if (dto.image !== undefined) category.image = dto.image;
    if (dto.isExposed !== undefined) category.isExposed = dto.isExposed;
    if (dto.isMainExposed !== undefined) category.isMainExposed = dto.isMainExposed;

    const saved = await this.categoryRepo.save(category);
    // Reload with relations to ensure majorCategory is available
    const updated = await this.categoryRepo.findOne({
      where: { id: saved.id },
      relations: ['majorCategory'],
    });
    return this.formatCategoryResponse(updated!);
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
        image: cat.image,
        isExposed: cat.isExposed,
        isMainExposed: cat.isMainExposed,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
      });
    }

    return Object.values(grouped);
  }

  async getFlattenedCategories(memberId?: number) {
    if (memberId) {
      const member = await this.taxMemberRepo.findOne({ where: { id: memberId } });
      if (!member) throw new NotFoundException('구성원을 찾을 수 없습니다.');

      const workAreas = member.workAreas || [];
      const ids = workAreas.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));

      if (ids.length === 0) return [];

      const categories = await this.categoryRepo.find({
        where: { id: In(ids), isExposed: true },
        relations: ['majorCategory'],
      });

      // Sort according to workAreas order
      return ids
        .map((id) => categories.find((c) => c.id === id))
        .filter(Boolean)
        .map((cat) => ({
          id: cat!.id,
          name: cat!.name,
          image: cat!.image,
          isExposed: cat!.isExposed,
          isMainExposed: cat!.isMainExposed,
          majorCategoryId: cat!.majorCategoryId,
          majorCategoryName: cat!.majorCategory?.name || '',
        }));
    }

    const categories = await this.categoryRepo.find({
      where: { isExposed: true },
      relations: ['majorCategory'],
      order: { createdAt: 'ASC' },
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      image: cat.image,
      isExposed: cat.isExposed,
      isMainExposed: cat.isMainExposed,
      majorCategoryId: cat.majorCategoryId,
      majorCategoryName: cat.majorCategory?.name || '',
    }));
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

    // Validate sectionContents match the sections from majorCategory
    if (!dto.sectionContents || dto.sectionContents.length === 0) {
      throw new BadRequestException('섹션별 본문을 입력해주세요.');
    }

    if (!majorCategory.sections || majorCategory.sections.length === 0) {
      throw new BadRequestException('선택한 Major Category에 섹션이 정의되어 있지 않습니다.');
    }

    const sectionNames = dto.sectionContents.map(sc => sc.section);
    const validSections = majorCategory.sections || [];
    const invalidSections = sectionNames.filter(section => !validSections.includes(section));
    if (invalidSections.length > 0) {
      throw new BadRequestException(
        `다음 섹션들은 선택한 Major Category에 속하지 않습니다: ${invalidSections.join(', ')}`
      );
    }
    // Check if all required sections are provided
    const missingSections = validSections.filter(section => !sectionNames.includes(section));
    if (missingSections.length > 0) {
      throw new BadRequestException(
        `다음 섹션들의 본문이 필요합니다: ${missingSections.join(', ')}`
      );
    }

    const allItems = await this.areaRepo.find({ order: { displayOrder: 'ASC' } });
    const currentCount = allItems.length;
    const targetOrder = dto.displayOrder ?? currentCount + 1;

    // Range Validation
    if (targetOrder < 1 || targetOrder > currentCount + 1 || !Number.isInteger(targetOrder)) {
      throw new BadRequestException({
        code: 'DISPLAY_ORDER_OUT_OF_RANGE',
        message: `displayOrder must be a unique value between 1 and ${currentCount + 1}, and values must be continuous.`,
      });
    }

    const item = this.areaRepo.create({
      name: dto.name,
      subDescription: dto.subDescription,
      image: dto.image,
      majorCategoryId: dto.majorCategory.id,
      minorCategoryId: dto.minorCategory.id,
      overview: dto.overview,
      sectionContents: dto.sectionContents,
      youtubeUrls: dto.youtubeUrls ?? [],
      isExposed: dto.isExposed ?? true,
      displayOrder: targetOrder,
    });

    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(BusinessArea);
      const saved = await repo.save(item);

      // Rebuild the list with the new item at target position
      const newList = [...allItems];
      newList.splice(targetOrder - 1, 0, saved);

      for (let i = 0; i < newList.length; i++) {
        const order = i + 1;
        await repo.update(newList[i].id, { displayOrder: order });
      }
    });

    return this.areaRepo.findOne({
      where: { id: item.id },
      relations: ['majorCategory', 'minorCategory'],
    });
  }

  async findAll(options: BusinessAreaListOptions = {}) {
    const {
      search,
      majorCategoryId,
      minorCategoryId,
      memberId,
      minorCategoryName,
      isExposed,
      sort = 'order',
      page = 1,
      limit = 20,
      includeHidden = false,
      isPublic = false
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

    // 대분류 필터
    if (majorCategoryId) {
      qb.andWhere('area.majorCategoryId = :majorCategoryId', { majorCategoryId });
    }

    // 중분류 필터
    if (minorCategoryId) {
      qb.andWhere('area.minorCategoryId = :minorCategoryId', { minorCategoryId });
    }

    // Filter by memberId: Get member's workAreas, then filter by minorCategory.name
    if (memberId) {
      const member = await this.taxMemberRepo.findOne({ where: { id: memberId } });
      if (!member) {
        throw new NotFoundException('구성원을 찾을 수 없습니다.');
      }

      // Get workAreas array (filter out empty/null values)
      const workAreas = (member.workAreas || []).filter(Boolean);

      if (workAreas.length === 0) {
        // If member has no workAreas, return empty result
        qb.andWhere('1 = 0'); // Always false condition
      } else {
        // Filter business areas where minorCategory.id is in the member's workAreas (stored as IDs)
        // Note: member.workAreas stores IDs as strings, so we convert them to numbers for the IN clause
        const workAreaIds = workAreas.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
        if (workAreaIds.length === 0) {
          qb.andWhere('1 = 0');
        } else {
          qb.andWhere('minorCategory.id IN (:...workAreaIds)', { workAreaIds });
        }
      }
    }

    // Filter by minorCategoryName directly
    if (minorCategoryName) {
      qb.andWhere('minorCategory.name = :minorCategoryName', { minorCategoryName });
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

    // 응답 포맷: 노출순서, 업무분야명, 업무분야(대분류), 업무분야(중분류), Youtube, 메인노출여부, 노출여부, 등록일시
    const formattedItems = items.map((item, index) => {
      // YouTube URLs 배열 처리
      const youtubeUrls = item.youtubeUrls || [];
      const youtubeCount = youtubeUrls.length;

      const base = {
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
        image: item.image,
        overview: item.overview,
        sectionContents: item.sectionContents || [],
        youtubeUrls,
        displayOrder: item.displayOrder,
        isExposed: item.isExposed,
      };

      if (isPublic) {
        return base;
      }

      return {
        ...base,
        youtubeCount,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
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

  async findById(id: number, isPublic = false) {
    const area = await this.areaRepo.findOne({
      where: { id },
      relations: ['majorCategory', 'minorCategory'],
    });
    if (!area) throw new NotFoundException('업무분야를 찾을 수 없습니다.');

    const base = {
      id: area.id,
      name: area.name,
      subDescription: area.subDescription,
      image: area.image,
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
      sectionContents: area.sectionContents || [],
      youtubeUrls: area.youtubeUrls || [],
      isExposed: area.isExposed,
      displayOrder: area.displayOrder,
    };

    if (isPublic) {
      return base;
    }

    return {
      ...base,
      youtubeCount: (area.youtubeUrls || []).length,
      createdAt: area.createdAt,
      updatedAt: area.updatedAt,
    };
  }

  async updateItem(id: number, dto: UpdateBusinessAreaItemDto) {
    const item = await this.areaRepo.findOne({
      where: { id },
      relations: ['majorCategory', 'minorCategory'],
    });
    if (!item) {
      throw new NotFoundException('업무분야를 찾을 수 없습니다.');
    }

    // Get the current or new major category for validation
    let majorCategory: InsightsSubcategory | null = item.majorCategory;
    if (dto.majorCategory) {
      const foundMajorCategory = await this.insightsSubcategoryRepo.findOne({
        where: { id: dto.majorCategory.id, isExposed: true },
      });
      if (!foundMajorCategory) {
        throw new NotFoundException('Major Category를 찾을 수 없습니다.');
      }
      majorCategory = foundMajorCategory;
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

    // Validate sectionContents if provided
    if (dto.sectionContents && majorCategory && majorCategory.sections) {
      const sectionNames = dto.sectionContents.map(sc => sc.section);
      const validSections = majorCategory.sections || [];
      const invalidSections = sectionNames.filter(section => !validSections.includes(section));
      if (invalidSections.length > 0) {
        throw new BadRequestException(
          `다음 섹션들은 선택한 Major Category에 속하지 않습니다: ${invalidSections.join(', ')}`
        );
      }
      // Check if all required sections are provided
      const missingSections = validSections.filter(section => !sectionNames.includes(section));
      if (missingSections.length > 0) {
        throw new BadRequestException(
          `다음 섹션들의 본문이 필요합니다: ${missingSections.join(', ')}`
        );
      }
    }

    if (dto.name) item.name = dto.name;
    if (dto.subDescription !== undefined) item.subDescription = dto.subDescription;
    if (dto.image) item.image = dto.image;
    if (dto.overview) item.overview = dto.overview;
    if (dto.body !== undefined) item.body = dto.body;
    if (dto.sectionContents !== undefined) item.sectionContents = dto.sectionContents;
    if (dto.youtubeUrls !== undefined) item.youtubeUrls = dto.youtubeUrls;
    if (dto.isExposed !== undefined) item.isExposed = dto.isExposed;

    // Handle DisplayOrder Reordering (Drag & Drop Style)
    if (dto.displayOrder !== undefined && dto.displayOrder !== item.displayOrder) {
      const allItems = await this.areaRepo.find({ order: { displayOrder: 'ASC' } });
      const currentCount = allItems.length;
      const targetOrder = dto.displayOrder;

      // Range Validation
      if (targetOrder < 1 || targetOrder > currentCount || !Number.isInteger(targetOrder)) {
        throw new BadRequestException({
          code: 'DISPLAY_ORDER_OUT_OF_RANGE',
          message: `displayOrder must be a unique value between 1 and ${currentCount}, and values must be continuous.`,
        });
      }

      // Remove the current item and insert at target position
      const otherItems = allItems.filter((i) => i.id !== id);
      otherItems.splice(targetOrder - 1, 0, item);

      await this.dataSource.transaction(async (manager) => {
        const repo = manager.getRepository(BusinessArea);
        for (let i = 0; i < otherItems.length; i++) {
          const order = i + 1;
          await repo.update(otherItems[i].id, { displayOrder: order });
        }
      });

      item.displayOrder = targetOrder;
    }

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
    await this.reorderAndNormalize();
    return { success: true, message: '삭제가 완료되었습니다.' };
  }

  async deleteMany(ids: number[]) {
    const areas = await this.areaRepo.find({ where: { id: In(ids) } });
    if (!areas.length) return { success: true, deleted: 0 };
    await this.areaRepo.remove(areas);
    await this.reorderAndNormalize();
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
    const allAreas = await this.areaRepo.find({ order: { displayOrder: 'ASC' } });
    if (!allAreas.length) return { success: true };

    // 1. Validate range and basic constraints first
    for (const item of items) {
      if (item.displayOrder < 1 || item.displayOrder > allAreas.length || !Number.isInteger(item.displayOrder)) {
        throw new BadRequestException({
          code: 'DISPLAY_ORDER_OUT_OF_RANGE',
          message: `displayOrder must be a value between 1 and ${allAreas.length}.`,
        });
      }
    }

    // 2. Validate uniqueness and continuity within the input (if full set is provided)
    if (items.length === allAreas.length) {
      const orders = items.map(i => i.displayOrder).sort((a, b) => a - b);

      // Check for duplicates
      for (let i = 0; i < orders.length - 1; i++) {
        if (orders[i] === orders[i + 1]) {
          throw new BadRequestException({
            code: 'DISPLAY_ORDER_DUPLICATED',
            message: 'Duplicate displayOrder detected.',
          });
        }
      }

      // Check for continuity
      for (let i = 0; i < orders.length; i++) {
        if (orders[i] !== i + 1) {
          throw new BadRequestException({
            code: 'DISPLAY_ORDER_NOT_CONTINUOUS',
            message: 'displayOrder sequence is not continuous.',
          });
        }
      }
    }

    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(BusinessArea);
      for (const item of items) {
        await repo.update(item.id, { displayOrder: item.displayOrder });
      }
    });

    await this.reorderAndNormalize();
    return { success: true };
  }

  private async reorderAndNormalize() {
    const areas = await this.areaRepo.find({
      order: { displayOrder: 'ASC', updatedAt: 'DESC' },
    });

    for (let i = 0; i < areas.length; i++) {
      const targetOrder = i + 1;
      if (areas[i].displayOrder !== targetOrder) {
        await this.areaRepo.update(areas[i].id, {
          displayOrder: targetOrder,
        });
      }
    }
  }

  /**
   * Get hierarchical data for public frontend (accordion-style UI)
   * Groups items by major category and then by minor category
   * Returns ALL exposed minorCategories, even if they have no items
   */
  async getHierarchicalData(isPublic = true) {
    // Step 1: Get all exposed minorCategories with their majorCategories
    // This ensures all exposed minorCategories are included, regardless of items
    const minorCategoriesWhere = isPublic ? { isExposed: true } : {};
    const minorCategories = await this.categoryRepo.find({
      where: minorCategoriesWhere,
      relations: ['majorCategory'],
      order: {
        majorCategoryId: 'ASC',
        createdAt: 'ASC',
      },
    });

    // Step 2: Get all items (filtered by isExposed if public)
    // Items are optional - they're just data for frontend labels
    const itemsWhere: any = {};
    if (isPublic) {
      itemsWhere.isExposed = true;
    }
    const items = await this.areaRepo.find({
      where: itemsWhere,
      relations: ['majorCategory', 'minorCategory'],
      order: {
        majorCategoryId: 'ASC',
        minorCategoryId: 'ASC',
        displayOrder: 'ASC',
        createdAt: 'DESC',
      },
    });

    // Step 3: Group items by minorCategoryId for quick lookup
    const itemsByMinorCategory: Record<number, BusinessArea[]> = {};
    for (const item of items) {
      if (!itemsByMinorCategory[item.minorCategoryId]) {
        itemsByMinorCategory[item.minorCategoryId] = [];
      }
      itemsByMinorCategory[item.minorCategoryId].push(item);
    }

    // Step 4: Build hierarchical structure starting from minorCategories
    // This ensures ALL exposed minorCategories are included, even with no items
    const grouped: Record<number, any> = {};

    for (const minorCategory of minorCategories) {
      const majorId = minorCategory.majorCategoryId;
      const minorId = minorCategory.id;

      // Initialize major category group if not exists
      if (!grouped[majorId]) {
        grouped[majorId] = {
          majorCategory: {
            id: minorCategory.majorCategory.id,
            name: minorCategory.majorCategory.name,
            sections: minorCategory.majorCategory.sections || [],
            isExposed: minorCategory.majorCategory.isExposed,
            displayOrder: minorCategory.majorCategory.displayOrder,
          },
          minorCategories: {},
        };
      }

      // Add minor category (even if it has no items)
      if (!grouped[majorId].minorCategories[minorId]) {
        grouped[majorId].minorCategories[minorId] = {
          id: minorCategory.id,
          name: minorCategory.name,
          image: minorCategory.image,
          isExposed: minorCategory.isExposed,
          isMainExposed: minorCategory.isMainExposed,
          items: [],
        };
      }

      // Add items for this minor category (if any exist)
      const categoryItems = itemsByMinorCategory[minorId] || [];
      for (const item of categoryItems) {
        const itemBase = {
          id: item.id,
          name: item.name,
          subDescription: item.subDescription,
          image: item.image,
          overview: item.overview,
          sectionContents: item.sectionContents || [],
          youtubeUrls: item.youtubeUrls || [],
          isExposed: item.isExposed,
          displayOrder: item.displayOrder,
        };

        grouped[majorId].minorCategories[minorId].items.push(
          isPublic
            ? itemBase
            : {
              ...itemBase,
              youtubeCount: (item.youtubeUrls || []).length,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
              createdAtFormatted: this.formatDateTime(item.createdAt),
              updatedAtFormatted: this.formatDateTime(item.updatedAt),
            },
        );
      }
    }

    // Convert to array format
    return Object.values(grouped).map((group: any) => ({
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

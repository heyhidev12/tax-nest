import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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
  isMainExposed?: boolean;
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
  ) { }

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
          isExposed: cat!.isExposed,
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
      isExposed: cat.isExposed,
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

    const item = this.areaRepo.create({
      name: dto.name,
      subDescription: dto.subDescription,
      image: dto.image,
      majorCategoryId: dto.majorCategory.id,
      minorCategoryId: dto.minorCategory.id,
      overview: dto.overview,
      sectionContents: dto.sectionContents,
      youtubeUrls: dto.youtubeUrls ?? [],
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
      memberId,
      minorCategoryName,
      isExposed,
      isMainExposed,
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

    // 응답 포맷: No, 노출순서, 업무분야명, 업무분야(대분류), 업무분야(중분류), Youtube, 메인노출여부, 노출여부, 등록일시
    // 번호는 최신 등록일 기준으로 순차 번호 부여 (등록일 DESC 기준)
    const formattedItems = items.map((item, index) => {
      // 최신순이면 큰 번호부터, 오래된순이면 작은 번호부터
      const no = sort === 'latest'
        ? total - ((page - 1) * limit + index)
        : (page - 1) * limit + index + 1;

      // YouTube URLs 배열 처리
      const youtubeUrls = item.youtubeUrls || [];
      const youtubeCount = youtubeUrls.length;

      const base = {
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
        image: item.image,
        overview: item.overview,
        sectionContents: item.sectionContents || [],
        youtubeUrls,
        displayOrder: item.displayOrder,
        isMainExposed: item.isMainExposed,
        isExposed: item.isExposed,
      };

      if (isPublic) {
        return base;
      }

      return {
        ...base,
        youtubeCount,
        mainExposedLabel: item.isMainExposed ? 'Y' : 'N',
        exposedLabel: item.isExposed ? 'Y' : 'N',
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        createdAtFormatted: this.formatDateTime(item.createdAt),
        updatedAtFormatted: this.formatDateTime(item.updatedAt),
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
      isMainExposed: area.isMainExposed,
      isExposed: area.isExposed,
      displayOrder: area.displayOrder,
    };

    if (isPublic) {
      return base;
    }

    return {
      ...base,
      youtubeCount: (area.youtubeUrls || []).length,
      mainExposedLabel: area.isMainExposed ? 'Y' : 'N',
      exposedLabel: area.isExposed ? 'Y' : 'N',
      createdAt: area.createdAt,
      updatedAt: area.updatedAt,
      createdAtFormatted: this.formatDateTime(area.createdAt),
      updatedAtFormatted: this.formatDateTime(area.updatedAt),
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
  async getHierarchicalData(isPublic = true) {
    const where = !isPublic ? {} : { isExposed: true };
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

      const itemBase = {
        id: item.id,
        name: item.name,
        subDescription: item.subDescription,
        image: item.image,
        overview: item.overview,
        sectionContents: item.sectionContents || [],
        youtubeUrls: item.youtubeUrls || [],
        isMainExposed: item.isMainExposed,
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

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository, In } from 'typeorm';
import { InsightsCategory } from 'src/libs/entity/insights-category.entity';
import { InsightsSubcategory } from 'src/libs/entity/insights-subcategory.entity';
import { InsightsItem } from 'src/libs/entity/insights-item.entity';
import { CreateCategoryDto } from 'src/libs/dto/insights/create-category.dto';
import { UpdateCategoryDto } from 'src/libs/dto/insights/update-category.dto';
import { CreateSubcategoryDto } from 'src/libs/dto/insights/create-subcategory.dto';
import { UpdateSubcategoryDto } from 'src/libs/dto/insights/update-subcategory.dto';
import { CreateItemDto } from 'src/libs/dto/insights/create-item.dto';
import { UpdateItemDto } from 'src/libs/dto/insights/update-item.dto';
import { VALID_INSIGHTS_SECTIONS } from 'src/libs/enums/insights-sections.enum';

@Injectable()
export class InsightsService {
  constructor(
    @InjectRepository(InsightsCategory)
    private readonly categoryRepo: Repository<InsightsCategory>,
    @InjectRepository(InsightsSubcategory)
    private readonly subcategoryRepo: Repository<InsightsSubcategory>,
    @InjectRepository(InsightsItem)
    private readonly itemRepo: Repository<InsightsItem>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  // ========== CATEGORY METHODS ==========

  /**
   * Create category (subcategories are now global and not linked to categories)
   */
  async createCategory(dto: CreateCategoryDto) {
    const category = this.categoryRepo.create({
      name: dto.name,
      type: dto.type,
      isActive: true,
    });

    return this.categoryRepo.save(category);
  }

  async findAllCategories(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };
    const categories = await this.categoryRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return categories;
  }

  async findCategoryById(id: number, includeInactive = false) {
    const category = await this.categoryRepo.findOne({
      where: includeInactive ? { id } : { id, isActive: true },
    });

    if (!category) {
      throw new NotFoundException('카테고리를 찾을 수 없습니다.');
    }

    return category;
  }

  async updateCategory(id: number, dto: UpdateCategoryDto) {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('카테고리를 찾을 수 없습니다.');
    }

    if (dto.name) category.name = dto.name;
    if (dto.type) category.type = dto.type;

    return this.categoryRepo.save(category);
  }

  async toggleCategoryActive(id: number) {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('카테고리를 찾을 수 없습니다.');
    }

    category.isActive = !category.isActive;
    await this.categoryRepo.save(category);

    return { success: true, isActive: category.isActive };
  }

  // ========== SUBCATEGORY METHODS ==========

  /**
   * Get all subcategories (global, not linked to categories)
   */
  async getAllSubcategories(includeHidden = false) {
    const where = includeHidden ? {} : { isExposed: true };
    const subcategories = await this.subcategoryRepo.find({
      where,
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });

    return subcategories.map((sub) => ({
      id: sub.id,
      name: sub.name,
      sections: sub.sections || [],
      isExposed: sub.isExposed,
      displayOrder: sub.displayOrder,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
    }));
  }

  /**
   * Get a single subcategory by ID
   */
  async getSubcategoryById(id: number, includeHidden = false) {
    const where: any = { id };
    if (!includeHidden) {
      where.isExposed = true;
    }

    const subcategory = await this.subcategoryRepo.findOne({ where });
    if (!subcategory) {
      throw new NotFoundException('서브카테고리를 찾을 수 없습니다.');
    }

    return {
      id: subcategory.id,
      name: subcategory.name,
      sections: subcategory.sections || [],
      isExposed: subcategory.isExposed,
      displayOrder: subcategory.displayOrder,
      createdAt: subcategory.createdAt,
      updatedAt: subcategory.updatedAt,
    };
  }

  async createSubcategory(dto: CreateSubcategoryDto) {
    // Validate sections contain only valid values
    const invalidSections = dto.sections.filter(
      (section) => !VALID_INSIGHTS_SECTIONS.includes(section as any),
    );
    if (invalidSections.length > 0) {
      throw new BadRequestException(
        `유효하지 않은 섹션 값입니다: ${invalidSections.join(', ')}. 유효한 값: ${VALID_INSIGHTS_SECTIONS.join(', ')}`,
      );
    }

    const subcategory = this.subcategoryRepo.create({
      name: dto.name,
      sections: dto.sections,
      isExposed: dto.isExposed ?? true,
      displayOrder: dto.displayOrder ?? 0,
    });

    return this.subcategoryRepo.save(subcategory);
  }

  async updateSubcategory(id: number, dto: UpdateSubcategoryDto) {
    const subcategory = await this.subcategoryRepo.findOne({ where: { id } });
    if (!subcategory) {
      throw new NotFoundException('서브카테고리를 찾을 수 없습니다.');
    }

    if (dto.name) subcategory.name = dto.name;

    if (dto.sections !== undefined) {
      // Validate sections contain only valid values
      const invalidSections = dto.sections.filter(
        (section) => !VALID_INSIGHTS_SECTIONS.includes(section as any),
      );
      if (invalidSections.length > 0) {
        throw new BadRequestException(
          `유효하지 않은 섹션 값입니다: ${invalidSections.join(', ')}. 유효한 값: ${VALID_INSIGHTS_SECTIONS.join(', ')}`,
        );
      }
      subcategory.sections = dto.sections;
    }

    if (dto.isExposed !== undefined) subcategory.isExposed = dto.isExposed;
    if (dto.displayOrder !== undefined) subcategory.displayOrder = dto.displayOrder;

    return this.subcategoryRepo.save(subcategory);
  }

  async deleteSubcategory(id: number) {
    const subcategory = await this.subcategoryRepo.findOne({ where: { id } });
    if (!subcategory) {
      throw new NotFoundException('서브카테고리를 찾을 수 없습니다.');
    }

    // Check if subcategory is used by any items
    const itemCount = await this.itemRepo.count({ where: { subcategoryId: id } });
    if (itemCount > 0) {
      throw new BadRequestException(
        `서브카테고리가 ${itemCount}개의 아이템에서 사용 중이어서 삭제할 수 없습니다.`,
      );
    }

    await this.subcategoryRepo.remove(subcategory);
    return { success: true };
  }

  async toggleSubcategoryExposed(id: number) {
    const subcategory = await this.subcategoryRepo.findOne({ where: { id } });
    if (!subcategory) {
      throw new NotFoundException('서브카테고리를 찾을 수 없습니다.');
    }

    subcategory.isExposed = !subcategory.isExposed;
    await this.subcategoryRepo.save(subcategory);

    return { success: true, isExposed: subcategory.isExposed };
  }

  // ========== ITEM METHODS ==========

  async createItem(dto: CreateItemDto) {
    // Validate category exists and is exposed
    const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId, isActive: true } });
    if (!category) {
      throw new NotFoundException('카테고리를 찾을 수 없습니다.');
    }

    // Validate subcategory exists and is exposed (subcategories are global, no category relationship)
    const subcategory = await this.subcategoryRepo.findOne({
      where: { id: dto.subcategoryId, isExposed: true },
    });
    if (!subcategory) {
      throw new NotFoundException('서브카테고리를 찾을 수 없습니다.');
    }

    const item = this.itemRepo.create({
      title: dto.title,
      thumbnailUrl: dto.thumbnailUrl || null,
      content: dto.content,
      categoryId: dto.categoryId,
      subcategoryId: dto.subcategoryId,
      enableComments: dto.enableComments ?? false,
      commentsLabel: dto.commentsLabel || 'N',
      isExposed: dto.isExposed ?? true,
      exposedLabel: dto.exposedLabel || 'Y',
    });

    const savedItem = await this.itemRepo.save(item);

    // Reload with relations for frontend-friendly response
    return this.itemRepo.findOne({
      where: { id: savedItem.id },
      relations: ['category', 'subcategory'],
    });
  }

  async updateItem(id: number, dto: UpdateItemDto) {
    const item = await this.itemRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('아이템을 찾을 수 없습니다.');
    }

    // If categoryId is being updated, validate category exists and is exposed
    if (dto.categoryId) {
      const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId, isActive: true } });
      if (!category) {
        throw new NotFoundException('카테고리를 찾을 수 없습니다.');
      }
    }

    // If subcategoryId is being updated, validate subcategory exists and is exposed (subcategories are global)
    if (dto.subcategoryId) {
      const subcategory = await this.subcategoryRepo.findOne({
        where: { id: dto.subcategoryId, isExposed: true },
      });
      if (!subcategory) {
        throw new NotFoundException('서브카테고리를 찾을 수 없습니다.');
      }
    }

    if (dto.title) item.title = dto.title;
    if (dto.thumbnailUrl !== undefined) item.thumbnailUrl = dto.thumbnailUrl || null;
    if (dto.content) item.content = dto.content;
    if (dto.categoryId) item.categoryId = dto.categoryId;
    if (dto.subcategoryId) item.subcategoryId = dto.subcategoryId;
    if (dto.enableComments !== undefined) item.enableComments = dto.enableComments;
    if (dto.commentsLabel) item.commentsLabel = dto.commentsLabel;
    if (dto.isExposed !== undefined) item.isExposed = dto.isExposed;
    if (dto.exposedLabel) item.exposedLabel = dto.exposedLabel;

    await this.itemRepo.save(item);

    // Reload with relations for frontend-friendly response
    return this.itemRepo.findOne({
      where: { id: item.id },
      relations: ['category', 'subcategory'],
    });
  }

  async deleteItem(id: number) {
    const item = await this.itemRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('아이템을 찾을 수 없습니다.');
    }

    await this.itemRepo.remove(item);
    return { success: true };
  }

  async getItemsByCategoryAndSubcategory(
    categoryId: number,
    subcategoryId?: number,
    includeHidden = false,
  ) {
    const where: any = { categoryId };
    if (subcategoryId) {
      where.subcategoryId = subcategoryId;
    }
    if (!includeHidden) {
      where.isExposed = true;
    }

    const items = await this.itemRepo.find({
      where,
      relations: ['category', 'subcategory'],
      order: { createdAt: 'DESC' },
    });

    // Return frontend-friendly format
    return items.map((item) => ({
      id: item.id,
      title: item.title,
      thumbnailUrl: item.thumbnailUrl,
      content: item.content,
      categoryId: item.categoryId,
      category: item.category
        ? {
            id: item.category.id,
            name: item.category.name,
            type: item.category.type,
          }
        : undefined,
      subcategoryId: item.subcategoryId,
      subcategory: item.subcategory
        ? {
            id: item.subcategory.id,
            name: item.subcategory.name,
            sections: item.subcategory.sections || [],
          }
        : undefined,
      enableComments: item.enableComments,
      commentsLabel: item.commentsLabel,
      isExposed: item.isExposed,
      exposedLabel: item.exposedLabel,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
  }

  async getItemById(id: number, includeHidden = false) {
    const where: any = { id };
    if (!includeHidden) {
      where.isExposed = true;
    }

    const item = await this.itemRepo.findOne({
      where,
      relations: ['category', 'subcategory'],
    });

    if (!item) {
      throw new NotFoundException('아이템을 찾을 수 없습니다.');
    }

    // Return frontend-friendly format
    return {
      id: item.id,
      title: item.title,
      thumbnailUrl: item.thumbnailUrl,
      content: item.content,
      categoryId: item.categoryId,
      category: item.category
        ? {
            id: item.category.id,
            name: item.category.name,
            type: item.category.type,
          }
        : undefined,
      subcategoryId: item.subcategoryId,
      subcategory: item.subcategory
        ? {
            id: item.subcategory.id,
            name: item.subcategory.name,
            sections: item.subcategory.sections || [],
          }
        : undefined,
      enableComments: item.enableComments,
      commentsLabel: item.commentsLabel,
      isExposed: item.isExposed,
      exposedLabel: item.exposedLabel,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  async getAllItems(includeHidden = false) {
    const where = includeHidden ? {} : { isExposed: true };
    const items = await this.itemRepo.find({
      where,
      relations: ['category', 'subcategory'],
      order: { createdAt: 'DESC' },
    });

    // Return frontend-friendly format
    return items.map((item) => ({
      id: item.id,
      title: item.title,
      thumbnailUrl: item.thumbnailUrl,
      content: item.content,
      categoryId: item.categoryId,
      category: item.category
        ? {
            id: item.category.id,
            name: item.category.name,
            type: item.category.type,
          }
        : undefined,
      subcategoryId: item.subcategoryId,
      subcategory: item.subcategory
        ? {
            id: item.subcategory.id,
            name: item.subcategory.name,
            sections: item.subcategory.sections || [],
          }
        : undefined,
      enableComments: item.enableComments,
      commentsLabel: item.commentsLabel,
      isExposed: item.isExposed,
      exposedLabel: item.exposedLabel,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
  }
}


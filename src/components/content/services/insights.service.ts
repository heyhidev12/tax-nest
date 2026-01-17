import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository, In, ILike } from 'typeorm';
import { InsightsCategory } from 'src/libs/entity/insights-category.entity';
import { InsightsSubcategory } from 'src/libs/entity/insights-subcategory.entity';
import { InsightsItem, InsightsComment, InsightsCommentReport } from 'src/libs/entity/insights-item.entity';
import { Attachment } from 'src/libs/entity/attachment.entity';
import { Member } from 'src/libs/entity/member.entity';
import { CreateCategoryDto } from 'src/libs/dto/insights/create-category.dto';
import { UpdateCategoryDto } from 'src/libs/dto/insights/update-category.dto';
import { CreateSubcategoryDto } from 'src/libs/dto/insights/create-subcategory.dto';
import { UpdateSubcategoryDto } from 'src/libs/dto/insights/update-subcategory.dto';
import { CreateItemDto } from 'src/libs/dto/insights/create-item.dto';
import { UpdateItemDto } from 'src/libs/dto/insights/update-item.dto';
import { VALID_INSIGHTS_SECTIONS } from 'src/libs/enums/insights-sections.enum';
import { AttachmentService } from './attachment.service';
import { UploadService } from 'src/libs/upload/upload.service';

@Injectable()
export class InsightsService {
  constructor(
    @InjectRepository(InsightsCategory)
    private readonly categoryRepo: Repository<InsightsCategory>,
    @InjectRepository(InsightsSubcategory)
    private readonly subcategoryRepo: Repository<InsightsSubcategory>,
    @InjectRepository(InsightsItem)
    private readonly itemRepo: Repository<InsightsItem>,
    @InjectRepository(InsightsComment)
    private readonly commentRepo: Repository<InsightsComment>,
    @InjectRepository(InsightsCommentReport)
    private readonly reportRepo: Repository<InsightsCommentReport>,
    @InjectRepository(Member)
    private readonly memberRepo: Repository<Member>,
    @InjectRepository(Attachment)
    private readonly attachmentRepo: Repository<Attachment>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly attachmentService: AttachmentService,
    private readonly uploadService: UploadService,
  ) { }

  // ========== CATEGORY METHODS ==========

  /**
   * Create category (subcategories are now global and not linked to categories)
   */
  async createCategory(dto: CreateCategoryDto) {
    const category = this.categoryRepo.create({
      name: dto.name,
      type: dto.type,
      targetMemberType: dto.targetMemberType,
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
    if (dto.targetMemberType) category.targetMemberType = dto.targetMemberType;

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

  async deleteCategory(id: number) {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('카테고리를 찾을 수 없습니다.');
    }

    // Check if category is used by any items
    const itemCount = await this.itemRepo.count({ where: { categoryId: id } });
    if (itemCount > 0) {
      throw new BadRequestException(
        `카테고리가 ${itemCount}개의 아이템에서 사용 중이어서 삭제할 수 없습니다.`,
      );
    }

    await this.categoryRepo.remove(category);
    return { success: true };
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

  /**
   * Helper method to format item with attachments
   * @param item The insight item
   * @param isPublicApi Whether this is for public/user API (returns thumbnail.url only)
   */
  private async formatItemWithAttachments(item: InsightsItem, isPublicApi = false) {
    // Format thumbnail and pdf based on API type
    const thumbnail = isPublicApi
      ? (item.thumbnail ? { url: item.thumbnail.url } : null)
      : item.thumbnail;

    const pdf = isPublicApi
      ? (item.pdf ? { url: item.pdf.url } : null)
      : item.pdf;

    const base = {
      id: item.id,
      title: item.title,
      thumbnail,
      pdf,
      content: item.content,
      category: item.category
        ? {
          id: item.category.id,
          name: item.category.name,
          type: item.category.type,
        }
        : undefined,
      subcategory: item.subcategory
        ? {
          id: item.subcategory.id,
          name: item.subcategory.name,
          sections: item.subcategory.sections || [],
        }
        : undefined,
      enableComments: item.enableComments,
      isExposed: item.isExposed,
      isMainExposed: item.isMainExposed,
    };

    if (isPublicApi) {
      return {
        ...base,
        authorName: item.admin ? item.admin.name : 'Admin',
        createdAt: item.createdAt,
      };
    }

    return {
      ...base,
      categoryId: item.categoryId,
      subcategoryId: item.subcategoryId,
      viewCount: item.viewCount || 0,
      commentCount: item.commentCount || 0,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      authorName: item.admin?.name,
    };
  }


  async createItem(dto: CreateItemDto, adminId?: number) {
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

    // Note: Attachments should be uploaded separately via /admin/attachments/upload
    // with targetType=INSIGHT and targetId set after article creation
    // The attachments array in DTO is kept for backward compatibility but is deprecated

    const item = this.itemRepo.create({
      title: dto.title,
      thumbnail: dto.thumbnail,
      pdf: dto.pdf,
      content: dto.content,
      categoryId: dto.categoryId,
      subcategoryId: dto.subcategoryId,
      enableComments: dto.enableComments ?? false,
      commentsLabel: dto.commentsLabel || 'N',
      isExposed: dto.isExposed ?? true,
      isMainExposed: dto.isMainExposed ?? false,
      exposedLabel: dto.exposedLabel || 'Y',
      adminId: adminId,
    });

    const savedItem = await this.itemRepo.save(item);

    // Note: Attachments should be uploaded via /admin/attachments/upload
    // with targetType=INSIGHT and targetId=savedItem.id

    // Reload with relations for frontend-friendly response
    const itemWithRelations = await this.itemRepo.findOne({
      where: { id: savedItem.id },
      relations: ['category', 'subcategory', 'admin'],
    });

    return await this.formatItemWithAttachments(itemWithRelations!);
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

    // Handle thumbnail cleanup when being replaced or removed
    if (dto.thumbnail !== undefined) {
      if (dto.thumbnail === null && item.thumbnail) {
        // Thumbnail is being removed
        await this.uploadService.deleteFileByUrl(item.thumbnail.url);
      } else if (dto.thumbnail && item.thumbnail && dto.thumbnail.url !== item.thumbnail.url) {
        // Thumbnail is being replaced
        await this.uploadService.deleteFileByUrl(item.thumbnail.url);
      }
      item.thumbnail = dto.thumbnail || null;
    }

    // Handle pdf cleanup when being replaced or removed
    if (dto.pdf !== undefined) {
      if (dto.pdf === null && item.pdf) {
        // PDF is being removed
        await this.uploadService.deleteFileByUrl(item.pdf.url);
      } else if (dto.pdf && item.pdf && dto.pdf.url !== item.pdf.url) {
        // PDF is being replaced
        await this.uploadService.deleteFileByUrl(item.pdf.url);
      }
      item.pdf = dto.pdf || null;
    }

    if (dto.title) item.title = dto.title;
    if (dto.content) item.content = dto.content;
    if (dto.categoryId) item.categoryId = dto.categoryId;
    if (dto.subcategoryId) item.subcategoryId = dto.subcategoryId;
    if (dto.enableComments !== undefined) item.enableComments = dto.enableComments;
    if (dto.commentsLabel) item.commentsLabel = dto.commentsLabel;
    if (dto.isExposed !== undefined) item.isExposed = dto.isExposed;
    if (dto.isMainExposed !== undefined) item.isMainExposed = dto.isMainExposed;
    if (dto.exposedLabel) item.exposedLabel = dto.exposedLabel;

    await this.itemRepo.save(item);

    // Reload with relations for frontend-friendly response
    const updatedItem = await this.itemRepo.findOne({
      where: { id: item.id },
      relations: ['category', 'subcategory', 'admin'],
    });

    return await this.formatItemWithAttachments(updatedItem!);
  }

  async deleteItem(id: number) {
    const item = await this.itemRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('아이템을 찾을 수 없습니다.');
    }

    // Cleanup S3 files before deleting entity
    if (item.thumbnail) {
      await this.uploadService.deleteFileByUrl(item.thumbnail.url);
    }
    if (item.pdf) {
      await this.uploadService.deleteFileByUrl(item.pdf.url);
    }

    await this.itemRepo.remove(item);
    return { success: true };
  }
  async getItemsByCategoryAndSubcategory(
    categoryId?: number,
    includeHidden = false,
    page = 1,
    limit = 20,
    authorName?: string,
  ) {
    const skip = (page - 1) * limit;
  
    const qb = this.itemRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category')
      .leftJoinAndSelect('item.subcategory', 'subcategory')
      .leftJoin('item.admin', 'admin');
  
    // Category filter (optional)
    if (categoryId) {
      qb.andWhere('item.categoryId = :categoryId', { categoryId });
    }
  
    // Exposure filter
    if (!includeHidden) {
      qb.andWhere('item.isExposed = :isExposed', { isExposed: true });
    }
  
    // Author name search (MySQL compatible, prevent NULL admin crash)
    if (authorName && authorName.trim() !== '') {
      qb.andWhere('admin.id IS NOT NULL')
        .andWhere('admin.name LIKE :authorName', {
          authorName: `%${authorName.trim()}%`,
        });
    }
  
    // Load admin relation for response formatting
    qb.leftJoinAndSelect('item.admin', 'adminForSelect');
  
    // Pagination + sorting
    qb.orderBy('item.createdAt', 'DESC')
      .skip(skip)
      .take(limit);
  
    const [items, total] = await qb.getManyAndCount();
  
    // Format response
    const formattedItems = await Promise.all(
      items.map((item) => this.formatItemWithAttachments(item)),
    );
  
    return {
      items: formattedItems,
      total,
      page,
      limit,
    };
  }

  async getItemById(id: number, includeHidden = false) {
    const where: any = { id };
    if (!includeHidden) {
      where.isExposed = true;
    }

    const item = await this.itemRepo.findOne({
      where,
      relations: ['category', 'subcategory', 'admin'],
    });

    if (!item) {
      throw new NotFoundException('아이템을 찾을 수 없습니다.');
    }

    // Return frontend-friendly format
    return await this.formatItemWithAttachments(item);
  }

  async getAllItems(includeHidden = false, page = 1, limit = 20, authorName?: string) {
    const skip = (page - 1) * limit;

    const qb = this.itemRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category')
      .leftJoinAndSelect('item.subcategory', 'subcategory')
      .leftJoin('item.admin', 'admin');

    // Exposure filter
    if (!includeHidden) {
      qb.andWhere('item.isExposed = :isExposed', { isExposed: true });
    }

    // Author name search (MySQL compatible, prevent NULL admin crash)
    if (authorName && authorName.trim() !== '') {
      qb.andWhere('admin.id IS NOT NULL')
        .andWhere('admin.name LIKE :authorName', {
          authorName: `%${authorName.trim()}%`,
        });
    }

    // Load admin relation for response formatting
    qb.leftJoinAndSelect('item.admin', 'adminForSelect');

    // Pagination + sorting
    qb.orderBy('item.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    // Return frontend-friendly format with pagination
    const formattedItems = await Promise.all(items.map((item) => this.formatItemWithAttachments(item)));

    return {
      items: formattedItems,
      total,
      page,
      limit,
    };
  }

  // ========== USER-FACING METHODS ==========

  /**
   * Get paginated list of exposed insights with optional filters
   */
  async getPublicInsights(options: {
    page?: number;
    limit?: number;
    categoryId?: number;
    subcategoryId?: number;
    dataRoom?: string;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.itemRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category')
      .leftJoinAndSelect('item.subcategory', 'subcategory')
      .leftJoinAndSelect('item.admin', 'admin')
      .where('item.isExposed = :isExposed', { isExposed: true });

    if (options.categoryId) {
      qb.andWhere('item.categoryId = :categoryId', { categoryId: options.categoryId });
    }

    if (options.subcategoryId) {
      qb.andWhere('item.subcategoryId = :subcategoryId', { subcategoryId: options.subcategoryId });
    }

    if (options.dataRoom) {
      qb.andWhere('category.type = :dataRoom', { dataRoom: options.dataRoom });
    }

    const [items, total] = await qb
      .orderBy('item.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Return frontend-friendly format
    const formattedItems = await Promise.all(items.map((item) => this.formatItemWithAttachments(item, true)));

    return {
      items: formattedItems,
      total,
      page,
      limit,
    };
  }

  /**
   * Get a single exposed insight by ID
   */
  async getPublicInsightById(id: number) {
    const item = await this.itemRepo.findOne({
      where: { id, isExposed: true },
      relations: ['category', 'subcategory', 'admin'],
    });

    if (!item) {
      throw new NotFoundException('인사이트를 찾을 수 없습니다.');
    }

    // Return frontend-friendly format
    return await this.formatItemWithAttachments(item, true);
  }

  /**
   * Increment view count for an insight
   */
  async incrementViewCount(id: number) {
    const item = await this.itemRepo.findOne({ where: { id, isExposed: true } });
    if (!item) {
      throw new NotFoundException('인사이트를 찾을 수 없습니다.');
    }

    item.viewCount = (item.viewCount || 0) + 1;
    await this.itemRepo.save(item);

    return { success: true, message: '조회수가 증가되었습니다.', viewCount: item.viewCount };
  }

  /**
   * Get hierarchical data for public frontend (accordion-style UI)
   * Groups items by category and then by subcategory
   */
  async getHierarchicalData(isPublic = true) {
    const qb = this.itemRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category')
      .leftJoinAndSelect('item.subcategory', 'subcategory')
      .leftJoinAndSelect('item.admin', 'admin');

    if (isPublic) {
      qb.where('item.isExposed = :isExposed', { isExposed: true })
        .andWhere('category.isActive = :isActive', { isActive: true })
        .andWhere('subcategory.isExposed = :subcategoryExposed', { subcategoryExposed: true });
    }

    qb.orderBy('item.categoryId', 'ASC')
      .addOrderBy('item.subcategoryId', 'ASC')
      .addOrderBy('item.createdAt', 'DESC');

    const items = await qb.getMany();

    // Group by category, then by subcategory
    const grouped: Record<number, any> = {};

    for (const item of items) {
      const categoryId = item.categoryId;
      const subcategoryId = item.subcategoryId;

      if (!grouped[categoryId]) {
        grouped[categoryId] = {
          category: {
            id: item.category.id,
            name: item.category.name,
            type: item.category.type,
            isActive: item.category.isActive,
          },
          subcategories: {},
        };
      }

      if (!grouped[categoryId].subcategories[subcategoryId]) {
        grouped[categoryId].subcategories[subcategoryId] = {
          id: item.subcategory.id,
          name: item.subcategory.name,
          sections: item.subcategory.sections || [],
          isExposed: item.subcategory.isExposed,
          displayOrder: item.subcategory.displayOrder,
          items: [],
        };
      }

      const itemBase = {
        id: item.id,
        title: item.title,
        thumbnail: isPublic ? (item.thumbnail ? { url: item.thumbnail.url } : null) : item.thumbnail,
        pdf: isPublic ? (item.pdf ? { url: item.pdf.url } : null) : item.pdf,
        content: item.content,
        enableComments: item.enableComments,
        isExposed: item.isExposed,
        isMainExposed: item.isMainExposed,
        authorName: item.admin ? item.admin.name : 'Admin',
        createdAt: item.createdAt,
      };

      grouped[categoryId].subcategories[subcategoryId].items.push(
        isPublic
          ? itemBase
          : {
            ...itemBase,
            viewCount: item.viewCount || 0,
            commentCount: item.commentCount || 0,
            updatedAt: item.updatedAt,
            createdAtFormatted: this.formatDateTime(item.createdAt),
            updatedAtFormatted: this.formatDateTime(item.updatedAt),
          },
      );
    }

    // Convert to array format
    return Object.values(grouped).map((group: any) => ({
      category: group.category,
      subcategories: Object.values(group.subcategories),
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

  // ========== COMMENT METHODS ==========

  /**
   * Get comments for an insight
   */
  async getComments(itemId: number) {
    // Verify item exists and is exposed
    const item = await this.itemRepo.findOne({ where: { id: itemId, isExposed: true } });
    if (!item) {
      throw new NotFoundException('인사이트를 찾을 수 없습니다.');
    }

    const comments = await this.commentRepo.find({
      where: { itemId },
      order: { createdAt: 'DESC' },
    });

    return {
      total: comments.length,
      items: comments.map((comment) => ({
        id: comment.id,
        body: comment.isHidden ? '해당 댓글은 다수 사용자의 신고에 의해 가려졌습니다.' : comment.body,
        authorName: comment.authorName || '-',
        memberId: comment.memberId,
        isHidden: comment.isHidden,
        isReported: comment.isReported,
        createdAt: comment.createdAt,
      })),
    };
  }

  /**
   * Create a comment for an insight
   */
  async createComment(itemId: number, dto: { body: string; memberId?: number; authorName?: string }) {
    // Verify item exists and is exposed
    const item = await this.itemRepo.findOne({ where: { id: itemId, isExposed: true } });
    if (!item) {
      throw new NotFoundException('인사이트를 찾을 수 없습니다.');
    }

    // Check if comments are enabled
    if (!item.enableComments) {
      throw new BadRequestException('이 인사이트는 댓글 기능이 비활성화되어 있습니다.');
    }

    // Use transaction to ensure atomicity
    return await this.dataSource.transaction(async (manager) => {
      const commentRepo = manager.getRepository(InsightsComment);
      const itemRepo = manager.getRepository(InsightsItem);

      const comment = commentRepo.create({
        itemId,
        body: dto.body.trim(),
        memberId: dto.memberId ?? null,
        authorName: dto.authorName ?? null,
      } as InsightsComment);

      const savedComment = await commentRepo.save(comment);

      // Atomically increment commentCount
      await itemRepo.increment({ id: itemId }, 'commentCount', 1);

      return {
        id: savedComment.id,
        body: savedComment.body,
        authorName: savedComment.authorName || '-',
        memberId: savedComment.memberId,
        createdAt: savedComment.createdAt,
      };
    });
  }

  /**
   * Delete a comment (only by the author)
   */
  async deleteComment(commentId: number, memberId?: number) {
    return await this.dataSource.transaction(async (manager) => {
      const commentRepo = manager.getRepository(InsightsComment);
      const itemRepo = manager.getRepository(InsightsItem);

      const comment = await commentRepo.findOne({
        where: { id: commentId },
        relations: ['item'],
      });

      if (!comment) {
        throw new NotFoundException('댓글을 찾을 수 없습니다.');
      }

      // Only the author can delete their comment
      if (comment.memberId && comment.memberId !== memberId) {
        throw new BadRequestException('본인의 댓글만 삭제할 수 있습니다.');
      }

      const itemId = comment.itemId;

      // Delete the comment
      await commentRepo.remove(comment);

      // Atomically decrement commentCount
      await itemRepo.decrement({ id: itemId }, 'commentCount', 1);

      // Ensure commentCount doesn't go below 0
      const item = await itemRepo.findOne({ where: { id: itemId } });
      if (item && item.commentCount < 0) {
        item.commentCount = 0;
        await itemRepo.save(item);
      }

      return { success: true, message: '댓글이 삭제되었습니다.' };
    });
  }

  /**
   * Get a comment by ID (for admin)
   */
  async getCommentById(commentId: number) {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
      relations: ['item', 'item.category', 'item.subcategory'],
    });

    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    // Get author info if memberId exists
    const author = comment.memberId
      ? await this.memberRepo.findOne({ where: { id: comment.memberId } })
      : null;

    // Get latest reporter info
    const latestReport = await this.reportRepo.findOne({
      where: { commentId },
      relations: ['reporter'],
      order: { createdAt: 'DESC' },
    });

    return {
      comment: {
        id: comment.id,
        body: comment.body,
        authorName: comment.authorName || '-',
        memberId: comment.memberId,
        isReported: comment.isReported,
        isHidden: comment.isHidden,
        createdAt: comment.createdAt,
      },
      author: author
        ? {
          id: author.id,
          loginId: author.loginId,
        }
        : null,
      reporter: latestReport?.reporter
        ? {
          id: latestReport.reporter.id,
          loginId: latestReport.reporter.loginId,
        }
        : null,
      insight: comment.item
        ? {
          id: comment.item.id,
          title: comment.item.title,
          categoryId: comment.item.categoryId,
          category: comment.item.category
            ? {
              id: comment.item.category.id,
              name: comment.item.category.name,
              type: comment.item.category.type,
            }
            : undefined,
          subcategory: comment.item.subcategory
            ? {
              id: comment.item.subcategory.id,
              name: comment.item.subcategory.name,
            }
            : undefined,
        }
        : undefined,
    };
  }

  /**
   * Toggle comment visibility (for admin)
   */
  async toggleCommentVisibility(commentId: number) {
    const comment = await this.commentRepo.findOne({ where: { id: commentId } });
    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    comment.isHidden = !comment.isHidden;
    await this.commentRepo.save(comment);

    return {
      success: true,
      isHidden: comment.isHidden,
    };
  }

  /**
   * Delete a comment (for admin - no memberId check)
   */
  async adminDeleteComment(commentId: number) {
    return await this.dataSource.transaction(async (manager) => {
      const commentRepo = manager.getRepository(InsightsComment);
      const itemRepo = manager.getRepository(InsightsItem);

      const comment = await commentRepo.findOne({
        where: { id: commentId },
        relations: ['item'],
      });

      if (!comment) {
        throw new NotFoundException('댓글을 찾을 수 없습니다.');
      }

      const itemId = comment.itemId;

      // Delete the comment
      await commentRepo.remove(comment);

      // Atomically decrement commentCount
      await itemRepo.decrement({ id: itemId }, 'commentCount', 1);

      // Ensure commentCount doesn't go below 0
      const item = await itemRepo.findOne({ where: { id: itemId } });
      if (item && item.commentCount < 0) {
        item.commentCount = 0;
        await itemRepo.save(item);
      }

      return { success: true, message: '댓글이 삭제되었습니다.' };
    });
  }

  /**
   * Report a comment
   * @param commentId - The comment ID to report
   * @param reporterId - The ID of the user reporting (from authentication)
   */
  async reportComment(commentId: number, reporterId: number) {
    return await this.dataSource.transaction(async (manager) => {
      const commentRepo = manager.getRepository(InsightsComment);
      const reportRepo = manager.getRepository(InsightsCommentReport);

      // Find the comment
      const comment = await commentRepo.findOne({ where: { id: commentId } });
      if (!comment) {
        throw new NotFoundException('댓글을 찾을 수 없습니다.');
      }

      // Prevent self-reporting
      if (comment.memberId === reporterId) {
        throw new BadRequestException('본인의 댓글은 신고할 수 없습니다.');
      }

      // Check if already reported by this user
      const existingReport = await reportRepo.findOne({
        where: { commentId, reporterId },
      });

      if (existingReport) {
        // Already reported, return success without creating duplicate
        return { success: true, message: '이미 신고된 댓글입니다.' };
      }

      // Create report record
      const report = reportRepo.create({
        commentId,
        reporterId,
      });

      await reportRepo.save(report);

      // Update comment's isReported flag if not already set
      if (!comment.isReported) {
        comment.isReported = true;
        await commentRepo.save(comment);
      }

      return { success: true, message: '댓글이 신고되었습니다.' };
    });
  }

  /**
   * Get reported comments with category filtering (for admin)
   */
  async getReportedComments(options: { categoryId?: number; page?: number; limit?: number }) {
    const { categoryId, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    // Query comments that have reports
    // First, get distinct comment IDs that have reports, ordered by latest report date
    const reportedCommentIds = await this.reportRepo
      .createQueryBuilder('report')
      .select('report.commentId', 'commentId')
      .addSelect('MAX(report.createdAt)', 'latestReportDate')
      .groupBy('report.commentId')
      .orderBy('latestReportDate', 'DESC')
      .getRawMany();

    const reportedIds = reportedCommentIds.map((r) => r.commentId);

    if (reportedIds.length === 0) {
      return {
        items: [],
        total: 0,
        page,
        limit,
      };
    }

    // Now query the comments with their items and categories
    const qb = this.commentRepo
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.item', 'item')
      .leftJoinAndSelect('item.category', 'category')
      .where('comment.id IN (:...reportedIds)', { reportedIds })
      .andWhere('comment.isReported = :isReported', { isReported: true });

    // Filter by category if provided
    if (categoryId !== undefined) {
      qb.andWhere('item.categoryId = :categoryId', { categoryId });
    }

    // Get total count (after category filter)
    const total = await qb.getCount();

    // Get all matching comments first
    const allMatchingComments = await qb.getMany();

    // Sort comments by the order from reportedCommentIds (latest report first)
    const orderedIds = reportedCommentIds.map((r) => r.commentId);
    const commentOrderMap = new Map(orderedIds.map((id, index) => [id, index]));
    allMatchingComments.sort((a, b) => {
      const orderA = commentOrderMap.get(a.id) ?? Infinity;
      const orderB = commentOrderMap.get(b.id) ?? Infinity;
      return orderA - orderB;
    });

    // Apply pagination
    const comments = allMatchingComments.slice(skip, skip + limit);

    // Fetch member information for authors
    const memberIds = comments
      .map((c) => c.memberId)
      .filter((id): id is number => id !== null && id !== undefined);

    const authors = memberIds.length > 0
      ? await this.memberRepo.find({ where: { id: In(memberIds) } })
      : [];

    const authorMap = new Map(authors.map((m) => [m.id, m]));

    // Fetch all reports for these comments with reporters
    const fetchedCommentIds = comments.map((c) => c.id);
    const allReports = fetchedCommentIds.length > 0
      ? await this.reportRepo.find({
        where: { commentId: In(fetchedCommentIds) },
        relations: ['reporter'],
        order: { createdAt: 'DESC' },
      })
      : [];

    // Group reports by commentId and get the latest report for each
    const reportMap = new Map<number, InsightsCommentReport>();
    allReports.forEach((report) => {
      if (!reportMap.has(report.commentId)) {
        reportMap.set(report.commentId, report);
      }
    });

    // Format response
    const items = comments.map((comment) => {
      const latestReport = reportMap.get(comment.id);
      const author = comment.memberId ? authorMap.get(comment.memberId) : null;
      const reporter = latestReport?.reporter || null;

      return {
        comment: {
          id: comment.id,
          body: comment.body,
        },
        author: author
          ? {
            id: author.id,
            loginId: author.loginId,
          }
          : null,
        reporter: reporter
          ? {
            id: reporter.id,
            loginId: reporter.loginId,
          }
          : null,
        insight: comment.item
          ? {
            id: comment.item.id,
            title: comment.item.title,
            categoryId: comment.item.categoryId,
            category: comment.item.category
              ? {
                id: comment.item.category.id,
                name: comment.item.category.name,
                type: comment.item.category.type,
              }
              : undefined,
          }
          : undefined,
        isReported: comment.isReported,
        isHidden: comment.isHidden,
        createdAt: comment.createdAt,
      };
    });

    return {
      items,
      total,
      page,
      limit,
    };
  }
}


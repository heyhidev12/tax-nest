import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { TaxMember } from 'src/libs/entity/tax-member.entity';
import { BusinessArea } from 'src/libs/entity/business-area.entity';
import { BusinessAreaCategory } from 'src/libs/entity/business-area-category.entity';
import { MemberWorkCategory } from 'src/libs/entity/member-work-category.entity';
import { UploadService } from 'src/libs/upload/upload.service';

interface TaxMemberListOptions {
  search?: string; // Search by insurance company name (affiliation) or member name
  businessAreaId?: number; // Filter by business area item ID (maps to categoryId)
  categoryId?: number; // Filter by category ID (many-to-many relationship)
  isExposed?: boolean;
  sort?: 'latest' | 'oldest' | 'order';
  page?: number;
  limit?: number;
  includeHidden?: boolean;
  isPublic?: boolean;
}

interface CategoryAssignment {
  categoryId: number;
  displayOrder: number;
}

@Injectable()
export class TaxMemberService {
  constructor(
    @InjectRepository(TaxMember)
    private readonly memberRepo: Repository<TaxMember>,
    @InjectRepository(BusinessArea)
    private readonly businessAreaRepo: Repository<BusinessArea>,
    @InjectRepository(BusinessAreaCategory)
    private readonly categoryRepo: Repository<BusinessAreaCategory>,
    @InjectRepository(MemberWorkCategory)
    private readonly memberWorkCategoryRepo: Repository<MemberWorkCategory>,
    private readonly uploadService: UploadService,
    private readonly dataSource: DataSource,
  ) { }

  async create(data: Partial<TaxMember> & { categories?: CategoryAssignment[] }) {
    const { categories, ...memberData } = data;

    const allMembers = await this.memberRepo.find({ order: { displayOrder: 'ASC' } });
    const currentCount = allMembers.length;
    const targetOrder = memberData.displayOrder ?? currentCount + 1;

    // Range Validation
    if (targetOrder < 1 || targetOrder > currentCount + 1 || !Number.isInteger(targetOrder)) {
      throw new BadRequestException({
        code: 'DISPLAY_ORDER_OUT_OF_RANGE',
        message: `표시 순서는 1부터 ${currentCount + 1} 사이의 유일한 값이어야 하며, 값은 누락 없이 연속되어야 합니다.`,
      });
    }

    // Validate categories exist
    if (categories && categories.length > 0) {
      const categoryIds = categories.map(c => c.categoryId);
      const existingCategories = await this.categoryRepo.find({
        where: { id: In(categoryIds) },
      });
      if (existingCategories.length !== categoryIds.length) {
        throw new BadRequestException('일부 카테고리가 존재하지 않습니다.');
      }

      // Check for duplicate categoryIds
      const uniqueIds = new Set(categoryIds);
      if (uniqueIds.size !== categoryIds.length) {
        throw new BadRequestException('중복된 카테고리가 있습니다.');
      }
    }

    const member = this.memberRepo.create(memberData);
    member.displayOrder = targetOrder;

    let savedMember: TaxMember;

    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(TaxMember);
      const mwcRepo = manager.getRepository(MemberWorkCategory);

      savedMember = await repo.save(member);

      // Create category mappings
      if (categories && categories.length > 0) {
        const mappings = categories.map(cat => mwcRepo.create({
          memberId: savedMember.id,
          categoryId: cat.categoryId,
          displayOrder: cat.displayOrder,
        }));
        await mwcRepo.save(mappings);
      }

      // Rebuild the list with the new item at target position
      const newList = [...allMembers];
      newList.splice(targetOrder - 1, 0, savedMember);

      for (let i = 0; i < newList.length; i++) {
        const order = i + 1;
        await repo.update(newList[i].id, { displayOrder: order });
      }
    });

    return this.findById(savedMember!.id);
  }

  async findAll(options: TaxMemberListOptions = {}) {
    const {
      search,
      businessAreaId,
      categoryId,
      isExposed,
      sort = 'order',
      page = 1,
      limit = 20,
      includeHidden = false,
      isPublic = false
    } = options;

    const qb = this.memberRepo.createQueryBuilder('member');

    // 조건들을 배열로 수집
    const conditions: string[] = [];
    const params: Record<string, any> = {};

    // 노출 여부 필터 (includeHidden이 false면 노출된 것만, true면 isExposed 파라미터에 따라)
    if (!includeHidden) {
      conditions.push('member.isExposed = :isExposed');
      params.isExposed = true;
    } else if (isExposed !== undefined) {
      conditions.push('member.isExposed = :isExposed');
      params.isExposed = isExposed;
    }

    // 검색: 보험사명(소속명) 또는 구성원 명 (이미지 요구사항에 따라)
    if (search) {
      conditions.push('(member.name LIKE :search OR member.affiliation LIKE :search)');
      params.search = `%${search}%`;
    }

    // Determine effective categoryId (from direct categoryId or from businessAreaId)
    let effectiveCategoryId = categoryId;

    // Filter by businessAreaId: Get the business area item's minorCategoryId and use it as categoryId
    if (businessAreaId && !categoryId) {
      const businessArea = await this.businessAreaRepo.findOne({
        where: { id: businessAreaId },
        relations: ['minorCategory'],
      });

      if (!businessArea) {
        throw new NotFoundException('업무분야를 찾을 수 없습니다.');
      }

      const minorCategoryId = businessArea.minorCategoryId;
      if (!minorCategoryId) {
        throw new NotFoundException('업무분야의 카테고리 정보를 찾을 수 없습니다.');
      }

      effectiveCategoryId = minorCategoryId;
    }

    // Filter by categoryId (using member_work_categories mapping table)
    if (effectiveCategoryId) {
      qb.innerJoin('member.memberWorkCategories', 'mwc', 'mwc.categoryId = :categoryId', { categoryId: effectiveCategoryId });
      // Add select for the ordering column to avoid TypeORM bug with getManyAndCount
      qb.addSelect('mwc.displayOrder');
    }

    // 조건 적용
    if (conditions.length > 0) {
      qb.where(conditions.join(' AND '), params);
    }

    // 정렬
    // If filtering by categoryId, use category-specific displayOrder with random fallback
    if (effectiveCategoryId) {
      qb.orderBy('mwc.displayOrder', 'ASC');
      qb.addOrderBy('member.id', 'ASC'); // Use deterministic secondary sort instead of RAND() for pagination
    } else if (sort === 'order') {
      qb.orderBy('member.displayOrder', 'DESC').addOrderBy('member.createdAt', 'DESC');
    } else if (sort === 'latest') {
      qb.orderBy('member.createdAt', 'DESC');
    } else {
      qb.orderBy('member.createdAt', 'ASC');
    }

    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    // Get member work categories for each member
    const memberIds = items.map(item => item.id);
    const memberWorkCategories = memberIds.length > 0
      ? await this.memberWorkCategoryRepo.find({
          where: { memberId: In(memberIds) },
          relations: ['category'],
          order: { displayOrder: 'ASC' },
        })
      : [];

    // Group work categories by memberId
    const categoriesByMemberId = memberWorkCategories.reduce((acc, mwc) => {
      if (!acc[mwc.memberId]) {
        acc[mwc.memberId] = [];
      }
      acc[mwc.memberId].push({
        categoryId: mwc.categoryId,
        categoryName: mwc.category?.name || '',
        displayOrder: mwc.displayOrder,
      });
      return acc;
    }, {} as Record<number, Array<{ categoryId: number; categoryName: string; displayOrder: number }>>);

    const formattedItems = items.map((item) => {
      const categories = categoriesByMemberId[item.id] || [];

      if (isPublic) {
        const { createdAt, updatedAt, ...rest } = item;
        return {
          ...rest,
          categories,
        };
      }
      return {
        ...item,
        categories,
      };
    });

    return { items: formattedItems, total, page, limit };
  }

  async findRandom(limit: number = 10) {
    // Return random members with isExposed = true, ordered by RAND() at DB level
    // Using raw SQL expression for RAND() function (MySQL)
    const members = await this.memberRepo
      .createQueryBuilder('member')
      .where('member.isExposed = :isExposed', { isExposed: true })
      .orderBy('RAND()') // MySQL RAND() function for random ordering at DB level
      .limit(limit)
      .getMany();

    // Get categories for the random members
    const memberIds = members.map(m => m.id);
    const memberWorkCategories = memberIds.length > 0
      ? await this.memberWorkCategoryRepo.find({
          where: { memberId: In(memberIds) },
          relations: ['category'],
          order: { displayOrder: 'ASC' },
        })
      : [];

    // Group work categories by memberId
    const categoriesByMemberId = memberWorkCategories.reduce((acc, mwc) => {
      if (!acc[mwc.memberId]) {
        acc[mwc.memberId] = [];
      }
      acc[mwc.memberId].push({
        categoryId: mwc.categoryId,
        categoryName: mwc.category?.name || '',
        displayOrder: mwc.displayOrder,
      });
      return acc;
    }, {} as Record<number, Array<{ categoryId: number; categoryName: string; displayOrder: number }>>);

    // Remove internal fields for public API
    return members.map(member => {
      const categories = categoriesByMemberId[member.id] || [];
      const { createdAt, updatedAt, ...rest } = member;
      return {
        ...rest,
        categories,
      };
    });
  }

  async findById(id: number, isPublic = false) {
    const member = await this.memberRepo.findOne({ where: { id } });
    if (!member) throw new NotFoundException('세무사 회원을 찾을 수 없습니다.');

    // Get categories from mapping table
    const memberWorkCategories = await this.memberWorkCategoryRepo.find({
      where: { memberId: id },
      relations: ['category'],
      order: { displayOrder: 'ASC' },
    });

    const categories = memberWorkCategories.map(mwc => ({
      categoryId: mwc.categoryId,
      categoryName: mwc.category?.name || '',
      displayOrder: mwc.displayOrder,
    }));

    if (isPublic) {
      const { createdAt, updatedAt, ...rest } = member;
      return {
        ...rest,
        categories,
      };
    }
    return {
      ...member,
      categories,
    };
  }

  /**
   * Find related experts based on shared categories
   * Used for "Related Experts" section on expert detail page
   */
  async findRelated(id: number, limit: number = 6) {
    // 1. Verify the member exists
    const member = await this.memberRepo.findOne({ where: { id } });
    if (!member) throw new NotFoundException('세무사 회원을 찾을 수 없습니다.');

    // 2. Get all category IDs for the current member
    const memberCategories = await this.memberWorkCategoryRepo.find({
      where: { memberId: id },
      select: ['categoryId'],
    });

    if (memberCategories.length === 0) {
      return []; // No categories = no related experts
    }

    const categoryIds = memberCategories.map(mc => mc.categoryId);

    // 3. Find other members who share any of these categories
    // Use raw query for proper random ordering and deduplication
    const relatedMemberIds = await this.dataSource
      .createQueryBuilder()
      .select('DISTINCT mwc.memberId', 'memberId')
      .addSelect('MIN(mwc.displayOrder)', 'minDisplayOrder')
      .from('member_work_categories', 'mwc')
      .innerJoin('tax_members', 'm', 'm.id = mwc.memberId')
      .where('mwc.categoryId IN (:...categoryIds)', { categoryIds })
      .andWhere('mwc.memberId != :currentMemberId', { currentMemberId: id })
      .andWhere('m.isExposed = :isExposed', { isExposed: true })
      .groupBy('mwc.memberId')
      .orderBy('minDisplayOrder', 'ASC')
      .addOrderBy('RAND()')
      .limit(limit)
      .getRawMany();

    if (relatedMemberIds.length === 0) {
      return [];
    }

    const memberIds = relatedMemberIds.map(r => r.memberId);

    // 4. Fetch full member data
    const members = await this.memberRepo.find({
      where: { id: In(memberIds), isExposed: true },
    });

    // 5. Get categories for each related member
    const memberWorkCategories = await this.memberWorkCategoryRepo.find({
      where: { memberId: In(memberIds) },
      relations: ['category'],
      order: { displayOrder: 'ASC' },
    });

    // Group categories by memberId
    const categoriesByMemberId = memberWorkCategories.reduce((acc, mwc) => {
      if (!acc[mwc.memberId]) {
        acc[mwc.memberId] = [];
      }
      acc[mwc.memberId].push({
        categoryId: mwc.categoryId,
        categoryName: mwc.category?.name || '',
        displayOrder: mwc.displayOrder,
      });
      return acc;
    }, {} as Record<number, Array<{ categoryId: number; categoryName: string; displayOrder: number }>>);

    // 6. Maintain the order from the query (sorted by displayOrder ASC, then random)
    const orderedMembers = memberIds
      .map(memberId => members.find(m => m.id === memberId))
      .filter((m): m is TaxMember => m !== undefined);

    // 7. Format response (public API format)
    return orderedMembers.map(member => {
      const categories = categoriesByMemberId[member.id] || [];
      const { createdAt, updatedAt, ...rest } = member;
      return {
        ...rest,
        categories,
      };
    });
  }

  async update(id: number, data: Partial<TaxMember> & { categories?: CategoryAssignment[] }) {
    const { categories, ...memberData } = data;

    const member = await this.memberRepo.findOne({ where: { id } });
    if (!member) throw new NotFoundException('세무사 회원을 찾을 수 없습니다.');

    // Validate categories if provided
    if (categories && categories.length > 0) {
      const categoryIds = categories.map(c => c.categoryId);
      const existingCategories = await this.categoryRepo.find({
        where: { id: In(categoryIds) },
      });
      if (existingCategories.length !== categoryIds.length) {
        throw new BadRequestException('일부 카테고리가 존재하지 않습니다.');
      }

      // Check for duplicate categoryIds
      const uniqueIds = new Set(categoryIds);
      if (uniqueIds.size !== categoryIds.length) {
        throw new BadRequestException('중복된 카테고리가 있습니다.');
      }
    }

    // 1. Handle DisplayOrder Reordering (Drag & Drop Style)
    if (memberData.displayOrder !== undefined && memberData.displayOrder !== member.displayOrder) {
      const allMembers = await this.memberRepo.find({ order: { displayOrder: 'ASC' } });
      const currentCount = allMembers.length;
      const targetOrder = memberData.displayOrder;

      // Range Validation
      if (targetOrder < 1 || targetOrder > currentCount || !Number.isInteger(targetOrder)) {
        throw new BadRequestException({
          code: 'DISPLAY_ORDER_OUT_OF_RANGE',
          message: `표시 순서는 1부터 ${currentCount} 사이의 유일한 값이어야 하며, 값은 누락 없이 연속되어야 합니다.`,
        });
      }

      // Remove the current member and insert at target position
      const otherMembers = allMembers.filter((m) => m.id !== id);
      otherMembers.splice(targetOrder - 1, 0, member);

      await this.dataSource.transaction(async (manager) => {
        const repo = manager.getRepository(TaxMember);
        for (let i = 0; i < otherMembers.length; i++) {
          const order = i + 1;
          await repo.update(otherMembers[i].id, { displayOrder: order });
        }
      });

      member.displayOrder = targetOrder;
    }

    // 2. Handle Category Updates (transactional)
    if (categories !== undefined) {
      await this.dataSource.transaction(async (manager) => {
        const mwcRepo = manager.getRepository(MemberWorkCategory);

        // Remove existing category mappings
        await mwcRepo.delete({ memberId: id });

        // Insert new category mappings
        if (categories.length > 0) {
          const mappings = categories.map(cat => mwcRepo.create({
            memberId: id,
            categoryId: cat.categoryId,
            displayOrder: cat.displayOrder,
          }));
          await mwcRepo.save(mappings);
        }
      });
    }

    // 3. Handle Other Field Updates
    const updatedData = { ...memberData };
    delete updatedData.displayOrder;

    if (Object.keys(updatedData).length > 0) {
      Object.assign(member, updatedData);
      await this.memberRepo.save(member);
    }

    return this.findById(id);
  }

  async delete(id: number) {
    const member = await this.memberRepo.findOne({ where: { id } });
    if (!member) throw new NotFoundException('세무사 회원을 찾을 수 없습니다.');

    // Cleanup S3 files before deleting entity
    if (member.mainPhoto) {
      await this.uploadService.deleteFileByUrl(member.mainPhoto.url);
    }
    if (member.subPhoto) {
      await this.uploadService.deleteFileByUrl(member.subPhoto.url);
    }
    if (member.vcard) {
      await this.uploadService.deleteFileByUrl(member.vcard.url);
    }
    if (member.pdf) {
      await this.uploadService.deleteFileByUrl(member.pdf.url);
    }

    await this.memberRepo.remove(member);
    await this.reorderAndNormalize();
    return { success: true, message: '삭제가 완료되었습니다.' };
  }

  async deleteMany(ids: number[]) {
    const members = await this.memberRepo.find({ where: { id: In(ids) } });
    if (!members.length) return { success: true, deleted: 0 };
    await this.memberRepo.remove(members);
    await this.reorderAndNormalize();
    return { success: true, deleted: members.length, message: '삭제가 완료되었습니다.' };
  }

  async toggleExposure(id: number) {
    const member = await this.memberRepo.findOne({ where: { id } });
    if (!member) throw new NotFoundException('세무사 회원을 찾을 수 없습니다.');
    member.isExposed = !member.isExposed;
    await this.memberRepo.save(member);
    return { success: true, isExposed: member.isExposed };
  }

  async updateOrder(items: { id: number; displayOrder: number }[]) {
    const allMembers = await this.memberRepo.find({ order: { displayOrder: 'ASC' } });
    if (!allMembers.length) return { success: true };

    // 1. Validate range and basic constraints first
    for (const item of items) {
      if (item.displayOrder < 1 || item.displayOrder > allMembers.length || !Number.isInteger(item.displayOrder)) {
        throw new BadRequestException({
          code: 'DISPLAY_ORDER_OUT_OF_RANGE',
          message: `표시 순서는 1부터 ${allMembers.length} 사이의 값이어야 합니다.`,
        });
      }
    }

    // 2. Validate uniqueness and continuity within the input
    if (items.length === allMembers.length) {
      const orders = items.map(i => i.displayOrder).sort((a, b) => a - b);

      // Check for duplicates
      for (let i = 0; i < orders.length - 1; i++) {
        if (orders[i] === orders[i + 1]) {
          throw new BadRequestException({
            code: 'DISPLAY_ORDER_DUPLICATED',
            message: '중복된 표시 순서가 있습니다.',
          });
        }
      }

      // Check for continuity
      for (let i = 0; i < orders.length; i++) {
        if (orders[i] !== i + 1) {
          throw new BadRequestException({
            code: 'DISPLAY_ORDER_NOT_CONTINUOUS',
            message: '표시 순서가 연속적이지 않습니다.',
          });
        }
      }
    }

    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(TaxMember);
      for (const item of items) {
        await repo.update(item.id, { displayOrder: item.displayOrder });
      }
    });

    await this.reorderAndNormalize();
    return { success: true };
  }

  private async reorderAndNormalize() {
    const members = await this.memberRepo.find({
      order: { displayOrder: 'ASC', updatedAt: 'DESC' },
    });

    for (let i = 0; i < members.length; i++) {
      const targetOrder = i + 1;
      if (members[i].displayOrder !== targetOrder) {
        await this.memberRepo.update(members[i].id, {
          displayOrder: targetOrder,
        });
      }
    }
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

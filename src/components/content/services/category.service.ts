import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { MajorCategory, MinorCategory } from 'src/libs/entity/category.entity';

interface CategoryListOptions {
  search?: string;
  isExposed?: boolean;
  sort?: 'latest' | 'oldest' | 'order';
  page?: number;
  limit?: number;
  includeHidden?: boolean;
}

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(MajorCategory)
    private readonly majorRepo: Repository<MajorCategory>,
    @InjectRepository(MinorCategory)
    private readonly minorRepo: Repository<MinorCategory>,
  ) { }

  // === Major Category ===
  async createMajor(name: string, isExposed = true) {
    const category = this.majorRepo.create({ name, isExposed });
    return this.majorRepo.save(category);
  }

  async findAllMajor(options: CategoryListOptions = {}) {
    const {
      search,
      isExposed,
      sort = 'order',
      page = 1,
      limit = 50,
      includeHidden = false,
    } = options;

    const qb = this.majorRepo.createQueryBuilder('major')
      .leftJoinAndSelect('major.minorCategories', 'minorCategories');

    if (!includeHidden) {
      qb.andWhere('major.isExposed = :isExposed', { isExposed: true });
    } else if (isExposed !== undefined) {
      qb.andWhere('major.isExposed = :isExposed', { isExposed });
    }

    // 카테고리명 검색
    if (search) {
      qb.andWhere('major.name LIKE :search', { search: `%${search}%` });
    }

    // 정렬
    if (sort === 'order') {
      qb.orderBy('major.displayOrder', 'ASC').addOrderBy('major.createdAt', 'DESC');
    } else if (sort === 'latest') {
      qb.orderBy('major.createdAt', 'DESC');
    } else {
      qb.orderBy('major.createdAt', 'ASC');
    }

    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    // 응답 포맷
    const formattedItems = items.map((item, index) => ({
      no: total - ((page - 1) * limit + index),
      id: item.id,
      name: item.name,
      displayOrder: item.displayOrder,
      isExposed: item.isExposed,
      minorCategoryCount: item.minorCategories?.length || 0,
      createdAt: item.createdAt,
    }));

    return { items: formattedItems, total, page, limit };
  }

  async findMajorById(id: number) {
    const category = await this.majorRepo.findOne({
      where: { id },
      relations: ['minorCategories'],
    });
    if (!category) throw new NotFoundException('대분류를 찾을 수 없습니다.');
    return category;
  }

  async findMajorByName(name: string) {
    const category = await this.majorRepo.findOne({
      where: { name },
      relations: ['minorCategories'],
    });
    return category || null;
  }

  async updateMajor(id: number, data: Partial<MajorCategory>) {
    const category = await this.majorRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('대분류를 찾을 수 없습니다.');
    Object.assign(category, data);
    return this.majorRepo.save(category);
  }

  async deleteMajor(id: number) {
    const category = await this.majorRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('대분류를 찾을 수 없습니다.');
    await this.majorRepo.remove(category);
    return { success: true, message: '삭제가 완료되었습니다.' };
  }

  async deleteMajors(ids: number[]) {
    const categories = await this.majorRepo.find({ where: { id: In(ids) } });
    if (!categories.length) return { success: true, deleted: 0 };
    await this.majorRepo.remove(categories);
    return { success: true, deleted: categories.length, message: '삭제가 완료되었습니다.' };
  }

  async toggleMajorExposure(id: number) {
    const category = await this.majorRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('대분류를 찾을 수 없습니다.');
    category.isExposed = !category.isExposed;
    await this.majorRepo.save(category);
    return { success: true, isExposed: category.isExposed };
  }

  async updateMajorOrder(items: { id: number; displayOrder: number }[]) {
    for (const item of items) {
      await this.majorRepo.update(item.id, { displayOrder: item.displayOrder });
    }
    return { success: true };
  }

  // === Minor Category ===
  async createMinor(majorCategoryId: number, name: string, isExposed = true) {
    await this.findMajorById(majorCategoryId);
    const category = this.minorRepo.create({ majorCategoryId, name, isExposed });
    return this.minorRepo.save(category);
  }

  async findMinorsByMajor(majorCategoryId: number, options: CategoryListOptions = {}) {
    const {
      search,
      isExposed,
      sort = 'order',
      page = 1,
      limit = 50,
      includeHidden = false,
    } = options;

    const qb = this.minorRepo.createQueryBuilder('minor')
      .leftJoinAndSelect('minor.majorCategory', 'majorCategory')
      .where('minor.majorCategoryId = :majorCategoryId', { majorCategoryId });

    if (!includeHidden) {
      qb.andWhere('minor.isExposed = :isExposed', { isExposed: true });
    } else if (isExposed !== undefined) {
      qb.andWhere('minor.isExposed = :isExposed', { isExposed });
    }

    // 중분류명 검색
    if (search) {
      qb.andWhere('minor.name LIKE :search', { search: `%${search}%` });
    }

    // 정렬
    if (sort === 'order') {
      qb.orderBy('minor.displayOrder', 'ASC').addOrderBy('minor.createdAt', 'DESC');
    } else if (sort === 'latest') {
      qb.orderBy('minor.createdAt', 'DESC');
    } else {
      qb.orderBy('minor.createdAt', 'ASC');
    }

    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    // 응답 포맷
    const formattedItems = items.map((item, index) => ({
      no: total - ((page - 1) * limit + index),
      id: item.id,
      majorCategoryId: item.majorCategoryId,
      majorCategoryName: item.majorCategory?.name || '-',
      name: item.name,
      displayOrder: item.displayOrder,
      isExposed: item.isExposed,
      createdAt: item.createdAt,
    }));

    return { items: formattedItems, total, page, limit };
  }

  async findMinorById(id: number) {
    const category = await this.minorRepo.findOne({
      where: { id },
      relations: ['majorCategory'],
    });
    if (!category) throw new NotFoundException('중분류를 찾을 수 없습니다.');
    return category;
  }

  async updateMinor(id: number, data: Partial<MinorCategory>) {
    const category = await this.minorRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('중분류를 찾을 수 없습니다.');
    Object.assign(category, data);
    return this.minorRepo.save(category);
  }

  async deleteMinor(id: number) {
    const category = await this.minorRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('중분류를 찾을 수 없습니다.');
    await this.minorRepo.remove(category);
    return { success: true, message: '삭제가 완료되었습니다.' };
  }

  async deleteMinors(ids: number[]) {
    const categories = await this.minorRepo.find({ where: { id: In(ids) } });
    if (!categories.length) return { success: true, deleted: 0 };
    await this.minorRepo.remove(categories);
    return { success: true, deleted: categories.length, message: '삭제가 완료되었습니다.' };
  }

  async toggleMinorExposure(id: number) {
    const category = await this.minorRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('중분류를 찾을 수 없습니다.');
    category.isExposed = !category.isExposed;
    await this.minorRepo.save(category);
    return { success: true, isExposed: category.isExposed };
  }

  async updateMinorOrder(items: { id: number; displayOrder: number }[]) {
    for (const item of items) {
      await this.minorRepo.update(item.id, { displayOrder: item.displayOrder });
    }
    return { success: true };
  }

  async updateOrder(type: 'major' | 'minor', items: { id: number; displayOrder: number }[]) {
    const repo = type === 'major' ? this.majorRepo : this.minorRepo;
    for (const item of items) {
      await repo.update(item.id, { displayOrder: item.displayOrder });
    }
    return { success: true };
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

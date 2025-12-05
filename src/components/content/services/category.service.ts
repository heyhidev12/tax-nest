import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { MajorCategory, MinorCategory } from 'src/libs/entity/category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(MajorCategory)
    private readonly majorRepo: Repository<MajorCategory>,
    @InjectRepository(MinorCategory)
    private readonly minorRepo: Repository<MinorCategory>,
  ) {}

  // === Major Category ===
  async createMajor(name: string) {
    const category = this.majorRepo.create({ name });
    return this.majorRepo.save(category);
  }

  async findAllMajor(includeHidden = false) {
    const where = includeHidden ? {} : { isExposed: true };
    return this.majorRepo.find({
      where,
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
      relations: ['minorCategories'],
    });
  }

  async findMajorById(id: number) {
    const category = await this.majorRepo.findOne({ 
      where: { id },
      relations: ['minorCategories'],
    });
    if (!category) throw new NotFoundException('대분류를 찾을 수 없습니다.');
    return category;
  }

  async updateMajor(id: number, data: Partial<MajorCategory>) {
    const category = await this.findMajorById(id);
    Object.assign(category, data);
    return this.majorRepo.save(category);
  }

  async deleteMajor(id: number) {
    const category = await this.findMajorById(id);
    await this.majorRepo.remove(category);
    return { success: true };
  }

  async deleteMajors(ids: number[]) {
    const categories = await this.majorRepo.find({ where: { id: In(ids) } });
    if (!categories.length) return { success: true, deleted: 0 };
    await this.majorRepo.remove(categories);
    return { success: true, deleted: categories.length };
  }

  async toggleMajorExposure(id: number) {
    const category = await this.majorRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('대분류를 찾을 수 없습니다.');
    category.isExposed = !category.isExposed;
    await this.majorRepo.save(category);
    return { success: true, isExposed: category.isExposed };
  }

  // === Minor Category ===
  async createMinor(majorCategoryId: number, name: string) {
    await this.findMajorById(majorCategoryId);
    const category = this.minorRepo.create({ majorCategoryId, name });
    return this.minorRepo.save(category);
  }

  async findMinorsByMajor(majorCategoryId: number, includeHidden = false) {
    const where: any = { majorCategoryId };
    if (!includeHidden) where.isExposed = true;
    return this.minorRepo.find({
      where,
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async findMinorById(id: number) {
    const category = await this.minorRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('중분류를 찾을 수 없습니다.');
    return category;
  }

  async updateMinor(id: number, data: Partial<MinorCategory>) {
    const category = await this.findMinorById(id);
    Object.assign(category, data);
    return this.minorRepo.save(category);
  }

  async deleteMinor(id: number) {
    const category = await this.findMinorById(id);
    await this.minorRepo.remove(category);
    return { success: true };
  }

  async deleteMinors(ids: number[]) {
    const categories = await this.minorRepo.find({ where: { id: In(ids) } });
    if (!categories.length) return { success: true, deleted: 0 };
    await this.minorRepo.remove(categories);
    return { success: true, deleted: categories.length };
  }

  async toggleMinorExposure(id: number) {
    const category = await this.minorRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('중분류를 찾을 수 없습니다.');
    category.isExposed = !category.isExposed;
    await this.minorRepo.save(category);
    return { success: true, isExposed: category.isExposed };
  }

  async updateOrder(type: 'major' | 'minor', items: { id: number; displayOrder: number }[]) {
    const repo = type === 'major' ? this.majorRepo : this.minorRepo;
    for (const item of items) {
      await repo.update(item.id, { displayOrder: item.displayOrder });
    }
    return { success: true };
  }
}


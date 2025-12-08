import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { HistoryYear, HistoryItem } from 'src/libs/entity/history.entity';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(HistoryYear)
    private readonly yearRepo: Repository<HistoryYear>,
    @InjectRepository(HistoryItem)
    private readonly itemRepo: Repository<HistoryItem>,
  ) {}

  // === Year CRUD ===
  async createYear(year: number) {
    const entity = this.yearRepo.create({ year });
    return this.yearRepo.save(entity);
  }

  async findAllYears(includeHidden = false) {
    const where = includeHidden ? {} : { isExposed: true };
    return this.yearRepo.find({
      where,
      order: { year: 'DESC' },
      relations: ['items'],
    });
  }

  async findYearById(id: number) {
    const year = await this.yearRepo.findOne({ 
      where: { id },
      relations: ['items'],
    });
    if (!year) throw new NotFoundException('연도를 찾을 수 없습니다.');
    return year;
  }

  async updateYear(id: number, data: Partial<HistoryYear>) {
    const year = await this.findYearById(id);
    Object.assign(year, data);
    return this.yearRepo.save(year);
  }

  async deleteYear(id: number) {
    const year = await this.findYearById(id);
    await this.yearRepo.remove(year);
    return { success: true };
  }

  async deleteYears(ids: number[]) {
    const years = await this.yearRepo.find({ where: { id: In(ids) } });
    if (!years.length) return { success: true, deleted: 0 };
    await this.yearRepo.remove(years);
    return { success: true, deleted: years.length };
  }

  async toggleYearExposure(id: number) {
    const year = await this.findYearById(id);
    year.isExposed = !year.isExposed;
    await this.yearRepo.save(year);
    return { success: true, isExposed: year.isExposed };
  }

  // === Item CRUD ===
  async createItem(historyYearId: number, data: { month?: number; content: string }) {
    const year = await this.findYearById(historyYearId);
    const item = this.itemRepo.create({
      historyYearId: year.id,
      ...data,
    });
    return this.itemRepo.save(item);
  }

  async updateItem(id: number, data: Partial<HistoryItem>) {
    const item = await this.itemRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('항목을 찾을 수 없습니다.');
    Object.assign(item, data);
    return this.itemRepo.save(item);
  }

  async deleteItem(id: number) {
    const item = await this.itemRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('항목을 찾을 수 없습니다.');
    await this.itemRepo.remove(item);
    return { success: true };
  }

  async deleteItems(ids: number[]) {
    const items = await this.itemRepo.find({ where: { id: In(ids) } });
    if (!items.length) return { success: true, deleted: 0 };
    await this.itemRepo.remove(items);
    return { success: true, deleted: items.length };
  }
}



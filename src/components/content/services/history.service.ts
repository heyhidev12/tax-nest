import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In } from 'typeorm';
import { HistoryYear, HistoryItem } from 'src/libs/entity/history.entity';
import { HistoryYearOrderItemDto } from 'src/libs/dto/history/update-year-order.dto';

interface YearListOptions {
  isExposed?: boolean;
  sort?: 'latest' | 'oldest' | 'order';
  page?: number;
  limit?: number;
  includeHidden?: boolean;
}

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(HistoryYear)
    private readonly yearRepo: Repository<HistoryYear>,
    @InjectRepository(HistoryItem)
    private readonly itemRepo: Repository<HistoryItem>,
    private readonly dataSource: DataSource,
  ) { }

  // === Year CRUD ===
  async createYear(year: number, isExposed = true) {
    const entity = this.yearRepo.create({ year, isExposed });
    return this.yearRepo.save(entity);
  }

  async findAllYears(options: YearListOptions = {}) {
    const {
      isExposed,
      sort = 'order',
      page = 1,
      limit = 50,
      includeHidden = false
    } = options;

    const qb = this.yearRepo.createQueryBuilder('year')
      .leftJoinAndSelect('year.items', 'items');

    if (!includeHidden) {
      qb.andWhere('year.isExposed = :isExposed', { isExposed: true });
    } else if (isExposed !== undefined) {
      qb.andWhere('year.isExposed = :isExposed', { isExposed });
    }

    // 정렬
    if (sort === 'order') {
      qb.orderBy('year.displayOrder', 'ASC').addOrderBy('year.year', 'DESC');
    } else if (sort === 'latest') {
      qb.orderBy('year.createdAt', 'DESC');
    } else {
      qb.orderBy('year.createdAt', 'ASC');
    }

    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    // 응답 포맷
    const formattedItems = items.map((item, index) => ({
      no: total - ((page - 1) * limit + index),
      id: item.id,
      year: item.year,
      displayOrder: item.displayOrder,
      isExposed: item.isExposed,
      itemCount: item.items?.length || 0,
      createdAt: item.createdAt,
    }));

    return { items: formattedItems, total, page, limit };
  }

  async findYearById(id: number) {
    const year = await this.yearRepo.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!year) throw new NotFoundException('연도를 찾을 수 없습니다.');

    // 아이템 정렬 및 포맷
    const formattedItems = (year.items || [])
      .sort((a, b) => a.displayOrder - b.displayOrder || b.createdAt.getTime() - a.createdAt.getTime())
      .map((item, index) => ({
        no: year.items.length - index,
        id: item.id,
        month: item.month,
        content: item.content,
        isExposed: item.isExposed,
        displayOrder: item.displayOrder,
        createdAt: item.createdAt,
      }));

    return {
      id: year.id,
      year: year.year,
      isExposed: year.isExposed,
      displayOrder: year.displayOrder,
      items: formattedItems,
      createdAt: year.createdAt,
    };
  }

  async updateYear(id: number, data: Partial<HistoryYear>) {
    const year = await this.yearRepo.findOne({ where: { id } });
    if (!year) throw new NotFoundException('연도를 찾을 수 없습니다.');
    Object.assign(year, data);
    return this.yearRepo.save(year);
  }

  async deleteYear(id: number) {
    const year = await this.yearRepo.findOne({ where: { id } });
    if (!year) throw new NotFoundException('연도를 찾을 수 없습니다.');
    await this.yearRepo.remove(year);
    return { success: true, message: '삭제가 완료되었습니다.' };
  }

  async deleteYears(ids: number[]) {
    const years = await this.yearRepo.find({ where: { id: In(ids) } });
    if (!years.length) return { success: true, deleted: 0 };
    await this.yearRepo.remove(years);
    return { success: true, deleted: years.length, message: '삭제가 완료되었습니다.' };
  }

  async toggleYearExposure(id: number) {
    const year = await this.yearRepo.findOne({ where: { id } });
    if (!year) throw new NotFoundException('연도를 찾을 수 없습니다.');
    year.isExposed = !year.isExposed;
    await this.yearRepo.save(year);
    return { success: true, isExposed: year.isExposed };
  }

  async updateYearOrder(items: HistoryYearOrderItemDto[]) {
    return await this.dataSource.transaction(async (manager) => {
      const yearRepo = manager.getRepository(HistoryYear);

      for (const item of items) {
        await yearRepo.update(item.id, { displayOrder: item.displayOrder });
      }

      return { success: true };
    });
  }

  // === Item CRUD ===
  async createItem(historyYearId: number, data: { month?: number; content: string; isExposed?: boolean }) {
    const year = await this.yearRepo.findOne({ where: { id: historyYearId } });
    if (!year) throw new NotFoundException('연도를 찾을 수 없습니다.');

    const item = this.itemRepo.create({
      historyYearId: year.id,
      month: data.month,
      content: data.content,
      isExposed: data.isExposed ?? true,
    });
    return this.itemRepo.save(item);
  }

  async findItemsByYear(historyYearId: number, includeHidden = false) {
    const qb = this.itemRepo.createQueryBuilder('item')
      .where('item.historyYearId = :historyYearId', { historyYearId });

    if (!includeHidden) {
      qb.andWhere('item.isExposed = :isExposed', { isExposed: true });
    }

    qb.orderBy('item.displayOrder', 'ASC').addOrderBy('item.createdAt', 'DESC');

    const items = await qb.getMany();

    return items.map((item, index) => ({
      no: items.length - index,
      id: item.id,
      month: item.month,
      content: item.content,
      isExposed: item.isExposed,
      displayOrder: item.displayOrder,
      createdAt: item.createdAt,
    }));
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
    return { success: true, message: '삭제가 완료되었습니다.' };
  }

  async deleteItems(ids: number[]) {
    const items = await this.itemRepo.find({ where: { id: In(ids) } });
    if (!items.length) return { success: true, deleted: 0 };
    await this.itemRepo.remove(items);
    return { success: true, deleted: items.length, message: '삭제가 완료되었습니다.' };
  }

  async toggleItemExposure(id: number) {
    const item = await this.itemRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('항목을 찾을 수 없습니다.');
    item.isExposed = !item.isExposed;
    await this.itemRepo.save(item);
    return { success: true, isExposed: item.isExposed };
  }

  async updateItemOrder(items: { id: number; displayOrder: number }[]) {
    for (const item of items) {
      await this.itemRepo.update(item.id, { displayOrder: item.displayOrder });
    }
    return { success: true };
  }

  /**
   * Get all exposed history items grouped by year (for user pages)
   * Returns data grouped by year, sorted by year descending, items by month/date descending
   */
  async getAllHistoryGroupedByYear() {
    // Fetch all exposed years with their exposed items
    const years = await this.yearRepo.find({
      where: { isExposed: true },
      relations: ['items'],
      order: { year: 'DESC' },
    });

    // Filter and format items, then group by year
    const groupedData = years
      .map((year) => {
        // Filter only exposed items
        const exposedItems = (year.items || [])
          .filter((item) => item.isExposed)
          .sort((a, b) => {
            // Sort by month descending, then by createdAt descending
            const monthA = a.month || 0;
            const monthB = b.month || 0;
            if (monthA !== monthB) {
              return monthB - monthA; // Descending
            }
            return b.createdAt.getTime() - a.createdAt.getTime(); // Descending
          })
          .map((item) => ({
            id: item.id,
            month: item.month,
            content: item.content,
            displayOrder: item.displayOrder,
            createdAt: item.createdAt,
          }));

        return {
          year: year.year,
          items: exposedItems,
        };
      })
      .filter((group) => group.items.length > 0); // Only include years with items

    return groupedData;
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

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ColumnArticle } from 'src/libs/entity/column.entity';

interface ColumnListOptions {
  search?: string;
  categoryName?: string;
  isExposed?: boolean;
  isMainExposed?: boolean;
  sort?: 'latest' | 'oldest' | 'order';
  page?: number;
  limit?: number;
  includeHidden?: boolean;
}

@Injectable()
export class ColumnService {
  constructor(
    @InjectRepository(ColumnArticle)
    private readonly columnRepo: Repository<ColumnArticle>,
  ) {}

  async create(data: Partial<ColumnArticle>) {
    const column = this.columnRepo.create(data);
    return this.columnRepo.save(column);
  }

  async findAll(options: ColumnListOptions = {}) {
    const { 
      search, 
      categoryName, 
      isExposed,
      isMainExposed,
      sort = 'latest',
      page = 1, 
      limit = 20, 
      includeHidden = false 
    } = options;
    
    const qb = this.columnRepo.createQueryBuilder('column');

    // 노출 여부 필터
    if (!includeHidden) {
      qb.andWhere('column.isExposed = :isExposed', { isExposed: true });
    } else if (isExposed !== undefined) {
      qb.andWhere('column.isExposed = :isExposed', { isExposed });
    }

    // 메인 노출 필터
    if (isMainExposed !== undefined) {
      qb.andWhere('column.isMainExposed = :isMainExposed', { isMainExposed });
    }

    // 카테고리 필터
    if (categoryName) {
      qb.andWhere('column.categoryName = :categoryName', { categoryName });
    }

    // 칼럼명 검색
    if (search) {
      qb.andWhere('column.name LIKE :search', { search: `%${search}%` });
    }

    // 정렬
    if (sort === 'order') {
      qb.orderBy('column.displayOrder', 'ASC').addOrderBy('column.createdAt', 'DESC');
    } else if (sort === 'latest') {
      qb.orderBy('column.createdAt', 'DESC');
    } else {
      qb.orderBy('column.createdAt', 'ASC');
    }

    // 페이지네이션
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    // 응답 포맷
    const formattedItems = items.map((item, index) => ({
      no: total - ((page - 1) * limit + index),
      id: item.id,
      name: item.name,
      namePreview: item.name.length > 10 ? item.name.slice(0, 10) + '...' : item.name,
      categoryName: item.categoryName,
      thumbnailUrl: item.thumbnailUrl,
      authorName: item.authorName || '-',
      displayOrder: item.displayOrder,
      isMainExposed: item.isMainExposed,
      mainExposedLabel: item.isMainExposed ? 'Y' : 'N',
      isExposed: item.isExposed,
      exposedLabel: item.isExposed ? 'Y' : 'N',
      createdAt: item.createdAt,
      createdAtFormatted: this.formatDateTime(item.createdAt),
    }));

    return { items: formattedItems, total, page, limit };
  }

  async findMainExposed() {
    const columns = await this.columnRepo.find({
      where: { isExposed: true, isMainExposed: true },
      order: { displayOrder: 'ASC' },
    });

    return columns.map((item, index) => ({
      no: index + 1,
      id: item.id,
      name: item.name,
      namePreview: item.name.length > 10 ? item.name.slice(0, 10) + '...' : item.name,
      categoryName: item.categoryName,
      thumbnailUrl: item.thumbnailUrl,
      authorName: item.authorName || '-',
    }));
  }

  async findById(id: number) {
    const column = await this.columnRepo.findOne({ where: { id } });
    if (!column) throw new NotFoundException('칼럼을 찾을 수 없습니다.');
    return {
      ...column,
      namePreview: column.name.length > 10 ? column.name.slice(0, 10) + '...' : column.name,
      mainExposedLabel: column.isMainExposed ? 'Y' : 'N',
      exposedLabel: column.isExposed ? 'Y' : 'N',
      createdAtFormatted: this.formatDateTime(column.createdAt),
      updatedAtFormatted: this.formatDateTime(column.updatedAt),
    };
  }

  async update(id: number, data: Partial<ColumnArticle>) {
    const column = await this.columnRepo.findOne({ where: { id } });
    if (!column) throw new NotFoundException('칼럼을 찾을 수 없습니다.');
    Object.assign(column, data);
    return this.columnRepo.save(column);
  }

  async delete(id: number) {
    const column = await this.columnRepo.findOne({ where: { id } });
    if (!column) throw new NotFoundException('칼럼을 찾을 수 없습니다.');
    await this.columnRepo.remove(column);
    return { success: true, message: '삭제가 완료되었습니다.' };
  }

  async deleteMany(ids: number[]) {
    const columns = await this.columnRepo.find({ where: { id: In(ids) } });
    if (!columns.length) return { success: true, deleted: 0 };
    await this.columnRepo.remove(columns);
    return { success: true, deleted: columns.length, message: '삭제가 완료되었습니다.' };
  }

  async toggleExposure(id: number) {
    const column = await this.columnRepo.findOne({ where: { id } });
    if (!column) throw new NotFoundException('칼럼을 찾을 수 없습니다.');
    column.isExposed = !column.isExposed;
    await this.columnRepo.save(column);
    return { success: true, isExposed: column.isExposed, exposedLabel: column.isExposed ? 'Y' : 'N' };
  }

  async toggleMainExposure(id: number) {
    const column = await this.columnRepo.findOne({ where: { id } });
    if (!column) throw new NotFoundException('칼럼을 찾을 수 없습니다.');
    column.isMainExposed = !column.isMainExposed;
    await this.columnRepo.save(column);
    return { success: true, isMainExposed: column.isMainExposed, mainExposedLabel: column.isMainExposed ? 'Y' : 'N' };
  }

  async updateOrder(items: { id: number; displayOrder: number }[]) {
    for (const item of items) {
      await this.columnRepo.update(item.id, { displayOrder: item.displayOrder });
    }
    return { success: true };
  }

  // 카테고리 목록 조회 (드롭다운용)
  async getCategories(): Promise<string[]> {
    const result = await this.columnRepo
      .createQueryBuilder('column')
      .select('DISTINCT column.categoryName', 'categoryName')
      .getRawMany();
    return result.map((r) => r.categoryName).filter(Boolean);
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

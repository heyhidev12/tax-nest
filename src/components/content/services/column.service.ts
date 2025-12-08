import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ColumnArticle } from 'src/libs/entity/column.entity';

interface ColumnListOptions {
  search?: string;
  categoryName?: string;
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
    const { search, categoryName, page = 1, limit = 20, includeHidden = false } = options;
    
    const where: any = {};
    if (!includeHidden) where.isExposed = true;
    if (categoryName) where.categoryName = categoryName;

    if (search) {
      const [items, total] = await this.columnRepo
        .createQueryBuilder('column')
        .where(where)
        .andWhere('column.name LIKE :search', { search: `%${search}%` })
        .orderBy('column.displayOrder', 'ASC')
        .addOrderBy('column.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();
      return { items, total, page, limit };
    }

    const [items, total] = await this.columnRepo.findAndCount({
      where,
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async findMainExposed() {
    return this.columnRepo.find({
      where: { isExposed: true, isMainExposed: true },
      order: { displayOrder: 'ASC' },
    });
  }

  async findById(id: number) {
    const column = await this.columnRepo.findOne({ where: { id } });
    if (!column) throw new NotFoundException('칼럼을 찾을 수 없습니다.');
    return column;
  }

  async update(id: number, data: Partial<ColumnArticle>) {
    const column = await this.findById(id);
    Object.assign(column, data);
    return this.columnRepo.save(column);
  }

  async delete(id: number) {
    const column = await this.findById(id);
    await this.columnRepo.remove(column);
    return { success: true };
  }

  async deleteMany(ids: number[]) {
    const columns = await this.columnRepo.find({ where: { id: In(ids) } });
    if (!columns.length) return { success: true, deleted: 0 };
    await this.columnRepo.remove(columns);
    return { success: true, deleted: columns.length };
  }

  async toggleExposure(id: number) {
    const column = await this.findById(id);
    column.isExposed = !column.isExposed;
    await this.columnRepo.save(column);
    return { success: true, isExposed: column.isExposed };
  }

  async toggleMainExposure(id: number) {
    const column = await this.findById(id);
    column.isMainExposed = !column.isMainExposed;
    await this.columnRepo.save(column);
    return { success: true, isMainExposed: column.isMainExposed };
  }

  async updateOrder(items: { id: number; displayOrder: number }[]) {
    for (const item of items) {
      await this.columnRepo.update(item.id, { displayOrder: item.displayOrder });
    }
    return { success: true };
  }
}



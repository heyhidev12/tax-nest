import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like } from 'typeorm';
import { BusinessArea, BusinessAreaContentType } from 'src/libs/entity/business-area.entity';

interface BusinessAreaListOptions {
  search?: string;
  contentType?: BusinessAreaContentType;
  majorCategory?: string;
  page?: number;
  limit?: number;
  includeHidden?: boolean;
}

@Injectable()
export class BusinessAreaService {
  constructor(
    @InjectRepository(BusinessArea)
    private readonly areaRepo: Repository<BusinessArea>,
  ) {}

  async create(data: Partial<BusinessArea>) {
    const area = this.areaRepo.create(data);
    return this.areaRepo.save(area);
  }

  async findAll(options: BusinessAreaListOptions = {}) {
    const { search, contentType, majorCategory, page = 1, limit = 20, includeHidden = false } = options;
    
    const where: any = {};
    if (!includeHidden) where.isExposed = true;
    if (contentType) where.contentType = contentType;
    if (majorCategory) where.majorCategory = majorCategory;

    if (search) {
      const [items, total] = await this.areaRepo
        .createQueryBuilder('area')
        .where(where)
        .andWhere('area.name LIKE :search', { search: `%${search}%` })
        .orderBy('area.displayOrder', 'ASC')
        .addOrderBy('area.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();
      return { items, total, page, limit };
    }

    const [items, total] = await this.areaRepo.findAndCount({
      where,
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async findMainExposed() {
    return this.areaRepo.find({
      where: { isExposed: true, isMainExposed: true },
      order: { displayOrder: 'ASC' },
    });
  }

  async findById(id: number) {
    const area = await this.areaRepo.findOne({ where: { id } });
    if (!area) throw new NotFoundException('업무분야를 찾을 수 없습니다.');
    return area;
  }

  async update(id: number, data: Partial<BusinessArea>) {
    const area = await this.findById(id);
    Object.assign(area, data);
    return this.areaRepo.save(area);
  }

  async delete(id: number) {
    const area = await this.findById(id);
    await this.areaRepo.remove(area);
    return { success: true };
  }

  async deleteMany(ids: number[]) {
    const areas = await this.areaRepo.find({ where: { id: In(ids) } });
    if (!areas.length) return { success: true, deleted: 0 };
    await this.areaRepo.remove(areas);
    return { success: true, deleted: areas.length };
  }

  async toggleExposure(id: number) {
    const area = await this.findById(id);
    area.isExposed = !area.isExposed;
    await this.areaRepo.save(area);
    return { success: true, isExposed: area.isExposed };
  }

  async toggleMainExposure(id: number) {
    const area = await this.findById(id);
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
}


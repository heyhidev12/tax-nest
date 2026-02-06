import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { FamilySite } from 'src/libs/entity/family-site.entity';

interface FamilySiteListOptions {
  isExposed?: boolean;
  sort?: 'latest' | 'oldest' | 'order';
  page?: number;
  limit?: number;
  includeHidden?: boolean;
}

@Injectable()
export class FamilySiteService {
  constructor(
    @InjectRepository(FamilySite)
    private readonly siteRepo: Repository<FamilySite>,
    private readonly dataSource: DataSource,
  ) {}

  // ===== ADMIN APIs =====

  async create(data: Partial<FamilySite>) {
    const allSites = await this.siteRepo.find({ order: { displayOrder: 'ASC' } });
    const currentCount = allSites.length;
    const targetOrder = data.displayOrder ?? currentCount + 1;

    // Range Validation
    if (targetOrder < 1 || targetOrder > currentCount + 1 || !Number.isInteger(targetOrder)) {
      throw new BadRequestException({
        code: 'DISPLAY_ORDER_OUT_OF_RANGE',
        message: `표시 순서는 1부터 ${currentCount + 1} 사이의 유일한 값이어야 합니다.`,
      });
    }

    const site = this.siteRepo.create({
      ...data,
      displayOrder: targetOrder,
    });

    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(FamilySite);
      const saved = await repo.save(site);

      // Rebuild the list with the new item at target position
      const newList = [...allSites];
      newList.splice(targetOrder - 1, 0, saved);

      for (let i = 0; i < newList.length; i++) {
        const order = i + 1;
        await repo.update(newList[i].id, { displayOrder: order });
      }
    });

    return this.siteRepo.findOne({
      where: { name: data.name },
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(options: FamilySiteListOptions = {}) {
    const {
      isExposed,
      sort = 'order',
      page = 1,
      limit = 50,
      includeHidden = false,
    } = options;

    const qb = this.siteRepo.createQueryBuilder('site');

    if (!includeHidden) {
      qb.andWhere('site.isExposed = :isExposed', { isExposed: true });
    } else if (isExposed !== undefined) {
      qb.andWhere('site.isExposed = :isExposed', { isExposed });
    }

    // 정렬
    if (sort === 'order') {
      qb.orderBy('site.displayOrder', 'ASC').addOrderBy('site.createdAt', 'DESC');
    } else if (sort === 'latest') {
      qb.orderBy('site.createdAt', 'DESC');
    } else {
      qb.orderBy('site.createdAt', 'ASC');
    }

    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return { items, total, page, limit };
  }

  async findById(id: number) {
    const site = await this.siteRepo.findOne({ where: { id } });
    if (!site) {
      throw new NotFoundException('Family site를 찾을 수 없습니다.');
    }
    return site;
  }

  async update(id: number, data: Partial<FamilySite>) {
    const site = await this.siteRepo.findOne({ where: { id } });
    if (!site) {
      throw new NotFoundException('Family site를 찾을 수 없습니다.');
    }

    // Handle DisplayOrder Reordering
    if (data.displayOrder !== undefined && data.displayOrder !== site.displayOrder) {
      const allSites = await this.siteRepo.find({ order: { displayOrder: 'ASC' } });
      const currentCount = allSites.length;
      const targetOrder = data.displayOrder;

      // Range Validation
      if (targetOrder < 1 || targetOrder > currentCount || !Number.isInteger(targetOrder)) {
        throw new BadRequestException({
          code: 'DISPLAY_ORDER_OUT_OF_RANGE',
          message: `표시 순서는 1부터 ${currentCount} 사이의 유일한 값이어야 합니다.`,
        });
      }

      // Remove the current site and insert at target position
      const otherSites = allSites.filter((s) => s.id !== id);
      otherSites.splice(targetOrder - 1, 0, site);

      await this.dataSource.transaction(async (manager) => {
        const repo = manager.getRepository(FamilySite);
        for (let i = 0; i < otherSites.length; i++) {
          const order = i + 1;
          await repo.update(otherSites[i].id, { displayOrder: order });
        }
      });

      site.displayOrder = targetOrder;
    }

    // Handle Other Field Updates
    const updatedData = { ...data };
    delete updatedData.displayOrder;

    if (Object.keys(updatedData).length > 0) {
      Object.assign(site, updatedData);
      await this.siteRepo.save(site);
    }

    await this.reorderAndNormalize();
    return this.findById(id);
  }

  async delete(id: number) {
    const site = await this.siteRepo.findOne({ where: { id } });
    if (!site) {
      throw new NotFoundException('Family site를 찾을 수 없습니다.');
    }
    await this.siteRepo.remove(site);
    await this.reorderAndNormalize();
    return { success: true, message: '삭제가 완료되었습니다.' };
  }

  async deleteMany(ids: number[]) {
    const sites = await this.siteRepo.find({ where: { id: In(ids) } });
    if (!sites.length) return { success: true, deleted: 0 };
    await this.siteRepo.remove(sites);
    await this.reorderAndNormalize();
    return { success: true, deleted: sites.length, message: '삭제가 완료되었습니다.' };
  }

  async toggleExposure(id: number) {
    const site = await this.siteRepo.findOne({ where: { id } });
    if (!site) {
      throw new NotFoundException('Family site를 찾을 수 없습니다.');
    }
    site.isExposed = !site.isExposed;
    await this.siteRepo.save(site);
    return { success: true, isExposed: site.isExposed };
  }

  async updateOrder(items: { id: number; displayOrder: number }[]) {
    const allSites = await this.siteRepo.find({ order: { displayOrder: 'ASC' } });
    if (!allSites.length) return { success: true };

    for (const item of items) {
      if (item.displayOrder < 1 || item.displayOrder > allSites.length || !Number.isInteger(item.displayOrder)) {
        throw new BadRequestException({
          code: 'DISPLAY_ORDER_OUT_OF_RANGE',
          message: `표시 순서는 1부터 ${allSites.length} 사이의 값이어야 합니다.`,
        });
      }
    }

    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(FamilySite);
      for (const item of items) {
        await repo.update(item.id, { displayOrder: item.displayOrder });
      }
    });

    await this.reorderAndNormalize();
    return { success: true };
  }

  private async reorderAndNormalize() {
    const sites = await this.siteRepo.find({
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
    });

    for (let i = 0; i < sites.length; i++) {
      const targetOrder = i + 1;
      if (sites[i].displayOrder !== targetOrder) {
        await this.siteRepo.update(sites[i].id, {
          displayOrder: targetOrder,
        });
      }
    }
  }

  // ===== PUBLIC APIs =====

  async findAllPublic() {
    const items = await this.siteRepo.find({
      where: { isExposed: true },
      order: { displayOrder: 'ASC' },
    });

    return items.map((item) => ({
      id: item.id,
      name: item.name,
      url: item.url,
      displayOrder: item.displayOrder,
    }));
  }
}

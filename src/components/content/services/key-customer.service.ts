import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { KeyCustomer } from 'src/libs/entity/key-customer.entity';

interface KeyCustomerListOptions {
  isExposed?: boolean;
  isMainExposed?: boolean;
  sort?: 'latest' | 'oldest' | 'order';
  page?: number;
  limit?: number;
  includeHidden?: boolean;
}

@Injectable()
export class KeyCustomerService {
  constructor(
    @InjectRepository(KeyCustomer)
    private readonly customerRepo: Repository<KeyCustomer>,
  ) {}

  async create(data: Partial<KeyCustomer>) {
    const customer = this.customerRepo.create(data);
    return this.customerRepo.save(customer);
  }

  async findAll(options: KeyCustomerListOptions = {}) {
    const { 
      isExposed,
      isMainExposed,
      sort = 'order',
      page = 1, 
      limit = 50, 
      includeHidden = false 
    } = options;

    const qb = this.customerRepo.createQueryBuilder('customer');

    if (!includeHidden) {
      qb.andWhere('customer.isExposed = :isExposed', { isExposed: true });
    } else if (isExposed !== undefined) {
      qb.andWhere('customer.isExposed = :isExposed', { isExposed });
    }

    if (isMainExposed !== undefined) {
      qb.andWhere('customer.isMainExposed = :isMainExposed', { isMainExposed });
    }

    // 정렬
    if (sort === 'order') {
      qb.orderBy('customer.displayOrder', 'ASC').addOrderBy('customer.createdAt', 'DESC');
    } else if (sort === 'latest') {
      qb.orderBy('customer.createdAt', 'DESC');
    } else {
      qb.orderBy('customer.createdAt', 'ASC');
    }

    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    // 응답 포맷
    const formattedItems = items.map((item, index) => ({
      no: total - ((page - 1) * limit + index),
      id: item.id,
      logoUrl: item.logoUrl,
      name: item.name,
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
    const customers = await this.customerRepo.find({
      where: { isExposed: true, isMainExposed: true },
      order: { displayOrder: 'ASC' },
    });

    return customers.map((item, index) => ({
      no: index + 1,
      id: item.id,
      logoUrl: item.logoUrl,
      name: item.name,
      displayOrder: item.displayOrder,
    }));
  }

  async findById(id: number) {
    const customer = await this.customerRepo.findOne({ where: { id } });
    if (!customer) throw new NotFoundException('주요고객을 찾을 수 없습니다.');
    return {
      ...customer,
      mainExposedLabel: customer.isMainExposed ? 'Y' : 'N',
      exposedLabel: customer.isExposed ? 'Y' : 'N',
      createdAtFormatted: this.formatDateTime(customer.createdAt),
      updatedAtFormatted: this.formatDateTime(customer.updatedAt),
    };
  }

  async update(id: number, data: Partial<KeyCustomer>) {
    const customer = await this.customerRepo.findOne({ where: { id } });
    if (!customer) throw new NotFoundException('주요고객을 찾을 수 없습니다.');
    Object.assign(customer, data);
    return this.customerRepo.save(customer);
  }

  async delete(id: number) {
    const customer = await this.customerRepo.findOne({ where: { id } });
    if (!customer) throw new NotFoundException('주요고객을 찾을 수 없습니다.');
    await this.customerRepo.remove(customer);
    return { success: true, message: '삭제가 완료되었습니다.' };
  }

  async deleteMany(ids: number[]) {
    const customers = await this.customerRepo.find({ where: { id: In(ids) } });
    if (!customers.length) return { success: true, deleted: 0 };
    await this.customerRepo.remove(customers);
    return { success: true, deleted: customers.length, message: '삭제가 완료되었습니다.' };
  }

  async toggleExposure(id: number) {
    const customer = await this.customerRepo.findOne({ where: { id } });
    if (!customer) throw new NotFoundException('주요고객을 찾을 수 없습니다.');
    customer.isExposed = !customer.isExposed;
    await this.customerRepo.save(customer);
    return { success: true, isExposed: customer.isExposed, exposedLabel: customer.isExposed ? 'Y' : 'N' };
  }

  async toggleMainExposure(id: number) {
    const customer = await this.customerRepo.findOne({ where: { id } });
    if (!customer) throw new NotFoundException('주요고객을 찾을 수 없습니다.');
    customer.isMainExposed = !customer.isMainExposed;
    await this.customerRepo.save(customer);
    return { success: true, isMainExposed: customer.isMainExposed, mainExposedLabel: customer.isMainExposed ? 'Y' : 'N' };
  }

  async updateOrder(items: { id: number; displayOrder: number }[]) {
    for (const item of items) {
      await this.customerRepo.update(item.id, { displayOrder: item.displayOrder });
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

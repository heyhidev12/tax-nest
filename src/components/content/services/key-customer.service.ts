import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { KeyCustomer } from 'src/libs/entity/key-customer.entity';

interface KeyCustomerListOptions {
  isExposed?: boolean;
  isMainExposed?: boolean;
  sort?: 'latest' | 'oldest' | 'order';
  page?: number;
  limit?: number;
  includeHidden?: boolean;
  isPublic?: boolean;
}

@Injectable()
export class KeyCustomerService {
  constructor(
    @InjectRepository(KeyCustomer)
    private readonly customerRepo: Repository<KeyCustomer>,
    private readonly dataSource: DataSource,
  ) { }

  async create(data: Partial<KeyCustomer>) {
    const allCustomers = await this.customerRepo.find({ order: { displayOrder: 'ASC' } });
    const currentCount = allCustomers.length;
    const targetOrder = data.displayOrder ?? currentCount + 1;

    // Range Validation
    if (targetOrder < 1 || targetOrder > currentCount + 1 || !Number.isInteger(targetOrder)) {
      throw new BadRequestException({
        code: 'DISPLAY_ORDER_OUT_OF_RANGE',
        message: `표시 순서는 1부터 ${currentCount + 1} 사이의 유일한 값이어야 하며, 값은 누락 없이 연속되어야 합니다.`,
      });
    }

    const customer = this.customerRepo.create({
      ...data,
      displayOrder: targetOrder,
    });

    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(KeyCustomer);
      const saved = await repo.save(customer);

      // Rebuild the list with the new item at target position
      const newList = [...allCustomers];
      newList.splice(targetOrder - 1, 0, saved);

      for (let i = 0; i < newList.length; i++) {
        const order = i + 1;
        await repo.update(newList[i].id, { displayOrder: order });
      }
    });

    const created = await this.customerRepo.findOne({
      where: { logo: data.logo as any },
      order: { createdAt: 'DESC' },
    });

    if (!created) {
      return null;
    }

    const { name, ...rest } = created;
    return {
      ...rest,
    };
  }

  async findAll(options: KeyCustomerListOptions = {}) {
    const {
      isExposed,
      isMainExposed,
      sort = 'order',
      page = 1,
      limit = 10,
      includeHidden = false,
      isPublic = false
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
    const formattedItems = items.map((item) => {
      if (isPublic) {
        return {
          id: item.id,
          logo: item.logo,
          websiteUrl: item.websiteUrl ?? null,
          displayOrder: item.displayOrder,
          isMainExposed: item.isMainExposed,
          isExposed: item.isExposed,
        };
      }

      // Admin/internal 목록: name은 노출하지 않고 websiteUrl 포함
      const { name, ...rest } = item;
      return {
        ...rest,
      };
    });

    return { items: formattedItems, total, page, limit };
  }

  async findMainExposed() {
    const customers = await this.customerRepo.find({
      where: { isExposed: true, isMainExposed: true },
      order: { displayOrder: 'ASC' },
    });

    return customers.map((item) => ({
      id: item.id,
      logo: item.logo,
      websiteUrl: item.websiteUrl ?? null,
      displayOrder: item.displayOrder,
    }));
  }

  async findById(id: number) {
    const customer = await this.customerRepo.findOne({ where: { id } });
    if (!customer) throw new NotFoundException('주요고객을 찾을 수 없습니다.');
    const { name, ...rest } = customer;
    return {
      ...rest,
    };
  }

  async update(id: number, data: Partial<KeyCustomer>) {
    const customer = await this.customerRepo.findOne({ where: { id } });
    if (!customer) throw new NotFoundException('주요고객을 찾을 수 없습니다.');

    // 1. Handle DisplayOrder Reordering (Drag & Drop Style)
    if (data.displayOrder !== undefined && data.displayOrder !== customer.displayOrder) {
      const allCustomers = await this.customerRepo.find({ order: { displayOrder: 'ASC' } });
      const currentCount = allCustomers.length;
      const targetOrder = data.displayOrder;

      // Range Validation
      if (targetOrder < 1 || targetOrder > currentCount || !Number.isInteger(targetOrder)) {
        throw new BadRequestException({
          code: 'DISPLAY_ORDER_OUT_OF_RANGE',
          message: `표시 순서는 1부터 ${currentCount} 사이의 유일한 값이어야 하며, 값은 누락 없이 연속되어야 합니다.`,
        });
      }

      // Remove the current customer and insert at target position
      const otherCustomers = allCustomers.filter((c) => c.id !== id);
      otherCustomers.splice(targetOrder - 1, 0, customer);

      await this.dataSource.transaction(async (manager) => {
        const repo = manager.getRepository(KeyCustomer);
        for (let i = 0; i < otherCustomers.length; i++) {
          const order = i + 1;
          await repo.update(otherCustomers[i].id, { displayOrder: order });
        }
      });

      // Update local customer object to reflect the new state
      customer.displayOrder = targetOrder;
    }

    // 2. Handle Other Field Updates
    const updatedData = { ...data };
    delete updatedData.displayOrder;

    if (Object.keys(updatedData).length > 0) {
      Object.assign(customer, updatedData);
      await this.customerRepo.save(customer);
    }

    await this.reorderAndNormalize();
    return this.findById(id);
  }

  async delete(id: number) {
    const customer = await this.customerRepo.findOne({ where: { id } });
    if (!customer) throw new NotFoundException('주요고객을 찾을 수 없습니다.');
    await this.customerRepo.remove(customer);
    await this.reorderAndNormalize();
    return { success: true, message: '삭제가 완료되었습니다.' };
  }

  async deleteMany(ids: number[]) {
    const customers = await this.customerRepo.find({ where: { id: In(ids) } });
    if (!customers.length) return { success: true, deleted: 0 };
    await this.customerRepo.remove(customers);
    await this.reorderAndNormalize();
    return { success: true, deleted: customers.length, message: '삭제가 완료되었습니다.' };
  }

  async toggleExposure(id: number) {
    const customer = await this.customerRepo.findOne({ where: { id } });
    if (!customer) throw new NotFoundException('주요고객을 찾을 수 없습니다.');
    customer.isExposed = !customer.isExposed;
    await this.customerRepo.save(customer);
    return { success: true, isExposed: customer.isExposed };
  }

  async toggleMainExposure(id: number) {
    const customer = await this.customerRepo.findOne({ where: { id } });
    if (!customer) throw new NotFoundException('주요고객을 찾을 수 없습니다.');
    customer.isMainExposed = !customer.isMainExposed;
    await this.customerRepo.save(customer);
    return { success: true, isMainExposed: customer.isMainExposed };
  }

  async updateOrder(items: { id: number; displayOrder: number }[]) {
    const allCustomers = await this.customerRepo.find({ order: { displayOrder: 'ASC' } });
    if (!allCustomers.length) return { success: true };

    // 1. Validate range and basic constraints first
    for (const item of items) {
      if (item.displayOrder < 1 || item.displayOrder > allCustomers.length || !Number.isInteger(item.displayOrder)) {
        throw new BadRequestException({
          code: 'DISPLAY_ORDER_OUT_OF_RANGE',
          message: `표시 순서는 1부터 ${allCustomers.length} 사이의 값이어야 합니다.`,
        });
      }
    }

    // 2. Validate uniqueness and continuity within the input
    if (items.length === allCustomers.length) {
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
      const repo = manager.getRepository(KeyCustomer);
      for (const item of items) {
        await repo.update(item.id, { displayOrder: item.displayOrder });
      }
    });

    await this.reorderAndNormalize();
    return { success: true };
  }

  private async reorderAndNormalize() {
    const customers = await this.customerRepo.find({
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
    });

    for (let i = 0; i < customers.length; i++) {
      const targetOrder = i + 1;
      if (customers[i].displayOrder !== targetOrder) {
        await this.customerRepo.update(customers[i].id, {
          displayOrder: targetOrder,
        });
      }
    }
  }
}

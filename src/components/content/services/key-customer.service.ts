import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { KeyCustomer } from 'src/libs/entity/key-customer.entity';

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

  async findAll(includeHidden = false) {
    const where = includeHidden ? {} : { isExposed: true };
    return this.customerRepo.find({
      where,
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async findMainExposed() {
    return this.customerRepo.find({
      where: { isExposed: true, isMainExposed: true },
      order: { displayOrder: 'ASC' },
    });
  }

  async findById(id: number) {
    const customer = await this.customerRepo.findOne({ where: { id } });
    if (!customer) throw new NotFoundException('주요고객을 찾을 수 없습니다.');
    return customer;
  }

  async update(id: number, data: Partial<KeyCustomer>) {
    const customer = await this.findById(id);
    Object.assign(customer, data);
    return this.customerRepo.save(customer);
  }

  async delete(id: number) {
    const customer = await this.findById(id);
    await this.customerRepo.remove(customer);
    return { success: true };
  }

  async deleteMany(ids: number[]) {
    const customers = await this.customerRepo.find({ where: { id: In(ids) } });
    if (!customers.length) return { success: true, deleted: 0 };
    await this.customerRepo.remove(customers);
    return { success: true, deleted: customers.length };
  }

  async toggleExposure(id: number) {
    const customer = await this.findById(id);
    customer.isExposed = !customer.isExposed;
    await this.customerRepo.save(customer);
    return { success: true, isExposed: customer.isExposed };
  }

  async toggleMainExposure(id: number) {
    const customer = await this.findById(id);
    customer.isMainExposed = !customer.isMainExposed;
    await this.customerRepo.save(customer);
    return { success: true, isMainExposed: customer.isMainExposed };
  }

  async updateOrder(items: { id: number; displayOrder: number }[]) {
    for (const item of items) {
      await this.customerRepo.update(item.id, { displayOrder: item.displayOrder });
    }
    return { success: true };
  }
}



import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TaxMember } from 'src/libs/entity/tax-member.entity';

interface TaxMemberListOptions {
  search?: string;
  workArea?: string;
  page?: number;
  limit?: number;
  includeHidden?: boolean;
}

@Injectable()
export class TaxMemberService {
  constructor(
    @InjectRepository(TaxMember)
    private readonly memberRepo: Repository<TaxMember>,
  ) {}

  async create(data: Partial<TaxMember>) {
    const member = this.memberRepo.create(data);
    return this.memberRepo.save(member);
  }

  async findAll(options: TaxMemberListOptions = {}) {
    const { search, workArea, page = 1, limit = 20, includeHidden = false } = options;

    const qb = this.memberRepo.createQueryBuilder('member');

    if (!includeHidden) {
      qb.andWhere('member.isExposed = :isExposed', { isExposed: true });
    }

    if (search) {
      qb.andWhere('member.name LIKE :search', { search: `%${search}%` });
    }

    if (workArea) {
      qb.andWhere('JSON_CONTAINS(member.workAreas, :workArea)', { 
        workArea: JSON.stringify(workArea) 
      });
    }

    qb.orderBy('member.displayOrder', 'ASC')
      .addOrderBy('member.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async findById(id: number) {
    const member = await this.memberRepo.findOne({ where: { id } });
    if (!member) throw new NotFoundException('세무사 회원을 찾을 수 없습니다.');
    return member;
  }

  async update(id: number, data: Partial<TaxMember>) {
    const member = await this.findById(id);
    Object.assign(member, data);
    return this.memberRepo.save(member);
  }

  async delete(id: number) {
    const member = await this.findById(id);
    await this.memberRepo.remove(member);
    return { success: true };
  }

  async deleteMany(ids: number[]) {
    const members = await this.memberRepo.find({ where: { id: In(ids) } });
    if (!members.length) return { success: true, deleted: 0 };
    await this.memberRepo.remove(members);
    return { success: true, deleted: members.length };
  }

  async toggleExposure(id: number) {
    const member = await this.findById(id);
    member.isExposed = !member.isExposed;
    await this.memberRepo.save(member);
    return { success: true, isExposed: member.isExposed };
  }

  async updateOrder(items: { id: number; displayOrder: number }[]) {
    for (const item of items) {
      await this.memberRepo.update(item.id, { displayOrder: item.displayOrder });
    }
    return { success: true };
  }
}



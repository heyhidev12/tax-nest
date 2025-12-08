import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Branch } from 'src/libs/entity/branch.entity';

interface BranchListOptions {
  search?: string;
  isExposed?: boolean;
  sort?: 'latest' | 'oldest' | 'order';
  page?: number;
  limit?: number;
  includeHidden?: boolean;
}

@Injectable()
export class BranchService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
  ) {}

  async create(data: Partial<Branch>) {
    const branch = this.branchRepo.create(data);
    return this.branchRepo.save(branch);
  }

  async findAll(options: BranchListOptions = {}) {
    const { 
      search,
      isExposed,
      sort = 'order',
      page = 1, 
      limit = 50, 
      includeHidden = false 
    } = options;

    const qb = this.branchRepo.createQueryBuilder('branch');

    if (!includeHidden) {
      qb.andWhere('branch.isExposed = :isExposed', { isExposed: true });
    } else if (isExposed !== undefined) {
      qb.andWhere('branch.isExposed = :isExposed', { isExposed });
    }

    // 이름 검색
    if (search) {
      qb.andWhere('branch.name LIKE :search', { search: `%${search}%` });
    }

    // 정렬
    if (sort === 'order') {
      qb.orderBy('branch.displayOrder', 'ASC').addOrderBy('branch.createdAt', 'DESC');
    } else if (sort === 'latest') {
      qb.orderBy('branch.createdAt', 'DESC');
    } else {
      qb.orderBy('branch.createdAt', 'ASC');
    }

    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    // 응답 포맷
    const formattedItems = items.map((item, index) => ({
      no: total - ((page - 1) * limit + index),
      id: item.id,
      name: item.name,
      address: item.address,
      phoneNumber: item.phoneNumber,
      fax: item.fax,
      email: item.email,
      displayOrder: item.displayOrder,
      isExposed: item.isExposed,
      exposedLabel: item.isExposed ? 'Y' : 'N',
      createdAt: item.createdAt,
      createdAtFormatted: this.formatDateTime(item.createdAt),
    }));

    return { items: formattedItems, total, page, limit };
  }

  async findById(id: number) {
    const branch = await this.branchRepo.findOne({ where: { id } });
    if (!branch) throw new NotFoundException('본사/지점을 찾을 수 없습니다.');
    return {
      ...branch,
      exposedLabel: branch.isExposed ? 'Y' : 'N',
      createdAtFormatted: this.formatDateTime(branch.createdAt),
      updatedAtFormatted: this.formatDateTime(branch.updatedAt),
    };
  }

  async update(id: number, data: Partial<Branch>) {
    const branch = await this.branchRepo.findOne({ where: { id } });
    if (!branch) throw new NotFoundException('본사/지점을 찾을 수 없습니다.');
    Object.assign(branch, data);
    return this.branchRepo.save(branch);
  }

  async delete(id: number) {
    const branch = await this.branchRepo.findOne({ where: { id } });
    if (!branch) throw new NotFoundException('본사/지점을 찾을 수 없습니다.');
    await this.branchRepo.remove(branch);
    return { success: true, message: '삭제가 완료되었습니다.' };
  }

  async deleteMany(ids: number[]) {
    const branches = await this.branchRepo.find({ where: { id: In(ids) } });
    if (!branches.length) return { success: true, deleted: 0 };
    await this.branchRepo.remove(branches);
    return { success: true, deleted: branches.length, message: '삭제가 완료되었습니다.' };
  }

  async toggleExposure(id: number) {
    const branch = await this.branchRepo.findOne({ where: { id } });
    if (!branch) throw new NotFoundException('본사/지점을 찾을 수 없습니다.');
    branch.isExposed = !branch.isExposed;
    await this.branchRepo.save(branch);
    return { success: true, isExposed: branch.isExposed, exposedLabel: branch.isExposed ? 'Y' : 'N' };
  }

  async updateOrder(items: { id: number; displayOrder: number }[]) {
    for (const item of items) {
      await this.branchRepo.update(item.id, { displayOrder: item.displayOrder });
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

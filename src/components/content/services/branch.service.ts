import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Branch } from 'src/libs/entity/branch.entity';

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

  async findAll(includeHidden = false) {
    const where = includeHidden ? {} : { isExposed: true };
    return this.branchRepo.find({
      where,
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async findById(id: number) {
    const branch = await this.branchRepo.findOne({ where: { id } });
    if (!branch) throw new NotFoundException('지점을 찾을 수 없습니다.');
    return branch;
  }

  async update(id: number, data: Partial<Branch>) {
    const branch = await this.findById(id);
    Object.assign(branch, data);
    return this.branchRepo.save(branch);
  }

  async delete(id: number) {
    const branch = await this.findById(id);
    await this.branchRepo.remove(branch);
    return { success: true };
  }

  async deleteMany(ids: number[]) {
    const branches = await this.branchRepo.find({ where: { id: In(ids) } });
    if (!branches.length) return { success: true, deleted: 0 };
    await this.branchRepo.remove(branches);
    return { success: true, deleted: branches.length };
  }

  async toggleExposure(id: number) {
    const branch = await this.findById(id);
    branch.isExposed = !branch.isExposed;
    await this.branchRepo.save(branch);
    return { success: true, isExposed: branch.isExposed };
  }

  async updateOrder(items: { id: number; displayOrder: number }[]) {
    for (const item of items) {
      await this.branchRepo.update(item.id, { displayOrder: item.displayOrder });
    }
    return { success: true };
  }
}



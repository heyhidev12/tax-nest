import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { Branch } from 'src/libs/entity/branch.entity';
import { GeocodingService } from './geocoding.service';

interface BranchListOptions {
  search?: string;
  isExposed?: boolean;
  sort?: 'latest' | 'oldest' | 'order';
  page?: number;
  limit?: number;
  includeHidden?: boolean;
  isPublic?: boolean;
}

@Injectable()
export class BranchService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
    private readonly geocodingService: GeocodingService,
    private readonly dataSource: DataSource,
  ) { }

  async create(data: Partial<Branch>) {
    const allBranches = await this.branchRepo.find({ order: { displayOrder: 'ASC' } });
    const currentCount = allBranches.length;
    const targetOrder = data.displayOrder ?? currentCount + 1;

    // Range Validation
    if (targetOrder < 1 || targetOrder > currentCount + 1 || !Number.isInteger(targetOrder)) {
      throw new BadRequestException({
        code: 'DISPLAY_ORDER_OUT_OF_RANGE',
        message: `표시 순서는 1부터 ${currentCount + 1} 사이의 유일한 값이어야 하며, 값은 누락 없이 연속되어야 합니다.`,
      });
    }

    const branch = this.branchRepo.create({
      ...data,
      displayOrder: targetOrder,
    });

    // Geocode address if provided - validation: must succeed if address is provided
    if (data.address && data.address.trim() !== '') {
      const coordinates = await this.geocodingService.geocodeAddress(data.address);
      if (!coordinates) {
        throw new BadRequestException('올바른 주소를 입력해주세요.');
      }
      branch.latitude = coordinates.latitude;
      branch.longitude = coordinates.longitude;
    }

    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Branch);
      const saved = await repo.save(branch);

      // Rebuild the list with the new item at target position
      const newList = [...allBranches];
      newList.splice(targetOrder - 1, 0, saved);

      for (let i = 0; i < newList.length; i++) {
        const order = i + 1;
        await repo.update(newList[i].id, { displayOrder: order });
      }
    });

    return (await this.branchRepo.findOne({ where: { name: branch.name }, order: { createdAt: 'DESC' } }))!;
  }

  async findAll(options: BranchListOptions = {}) {
    const {
      search,
      isExposed,
      sort = 'order',
      page = 1,
      limit = 50,
      includeHidden = false,
      isPublic = false
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

    // 응답 포맷: 전체 지점 정보 + 관리자용 메타데이터
    const formattedItems = items.map((item) => {
      if (isPublic) {
        const { createdAt, updatedAt, ...rest } = item;
        return rest;
      }
      return {
        ...item,
      };
    });

    return { items: formattedItems, total, page, limit };
  }

  async findById(id: number, isPublic = false) {
    const branch = await this.branchRepo.findOne({ where: { id } });
    if (!branch) throw new NotFoundException('본사/지점을 찾을 수 없습니다.');

    if (isPublic) {
      const { createdAt, updatedAt, ...rest } = branch;
      return rest;
    }
    return {
      ...branch,
    };
  }

  async update(id: number, data: Partial<Branch>) {
    const branch = await this.branchRepo.findOne({ where: { id } });
    if (!branch) throw new NotFoundException('본사/지점을 찾을 수 없습니다.');

    // 1. Handle DisplayOrder Reordering (Drag & Drop Style)
    if (data.displayOrder !== undefined && data.displayOrder !== branch.displayOrder) {
      const allBranches = await this.branchRepo.find({ order: { displayOrder: 'ASC' } });
      const currentCount = allBranches.length;
      const targetOrder = data.displayOrder;

      // Range Validation
      if (targetOrder < 1 || targetOrder > currentCount || !Number.isInteger(targetOrder)) {
        throw new BadRequestException({
          code: 'DISPLAY_ORDER_OUT_OF_RANGE',
          message: `표시 순서는 1부터 ${currentCount} 사이의 유일한 값이어야 하며, 값은 누락 없이 연속되어야 합니다.`,
        });
      }

      // Remove the current branch and insert at target position
      const otherBranches = allBranches.filter((b) => b.id !== id);
      otherBranches.splice(targetOrder - 1, 0, branch);

      await this.dataSource.transaction(async (manager) => {
        const repo = manager.getRepository(Branch);
        for (let i = 0; i < otherBranches.length; i++) {
          const order = i + 1;
          await repo.update(otherBranches[i].id, { displayOrder: order });
        }
      });

      // Update local branch object to reflect the new state
      branch.displayOrder = targetOrder;
    }

    // 2. Handle Other Field Updates
    const updatedData = { ...data };
    delete updatedData.displayOrder;

    // Geocode address if provided - validation: must succeed if address is provided
    if (updatedData.address && updatedData.address.trim() !== '') {
      const coordinates = await this.geocodingService.geocodeAddress(updatedData.address);
      if (!coordinates) {
        throw new BadRequestException('올바른 주소를 입력해주세요.');
      }
      updatedData.latitude = coordinates.latitude;
      updatedData.longitude = coordinates.longitude;
    }

    if (Object.keys(updatedData).length > 0) {
      Object.assign(branch, updatedData);
      await this.branchRepo.save(branch);
    }

    await this.reorderAndNormalize();
    return this.findById(id);
  }

  async delete(id: number) {
    const branch = await this.branchRepo.findOne({ where: { id } });
    if (!branch) throw new NotFoundException('본사/지점을 찾을 수 없습니다.');
    await this.branchRepo.remove(branch);
    await this.reorderAndNormalize();
    return { success: true, message: '삭제가 완료되었습니다.' };
  }

  async deleteMany(ids: number[]) {
    const branches = await this.branchRepo.find({ where: { id: In(ids) } });
    if (!branches.length) return { success: true, deleted: 0 };
    await this.branchRepo.remove(branches);
    await this.reorderAndNormalize();
    return { success: true, deleted: branches.length, message: '삭제가 완료되었습니다.' };
  }

  async toggleExposure(id: number) {
    const branch = await this.branchRepo.findOne({ where: { id } });
    if (!branch) throw new NotFoundException('본사/지점을 찾을 수 없습니다.');
    branch.isExposed = !branch.isExposed;
    await this.branchRepo.save(branch);
    return { success: true, isExposed: branch.isExposed };
  }

  async updateOrder(items: { id: number; displayOrder: number }[]) {
    const allBranches = await this.branchRepo.find({ order: { displayOrder: 'ASC' } });
    if (!allBranches.length) return { success: true };

    // 1. Validate range and basic constraints first
    for (const item of items) {
      if (item.displayOrder < 1 || item.displayOrder > allBranches.length || !Number.isInteger(item.displayOrder)) {
        throw new BadRequestException({
          code: 'DISPLAY_ORDER_OUT_OF_RANGE',
          message: `표시 순서는 1부터 ${allBranches.length} 사이의 값이어야 합니다.`,
        });
      }
    }

    // 2. Validate uniqueness and continuity within the input
    // This assumes updateOrder is used for bulk reordering of the entire list.
    if (items.length === allBranches.length) {
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
      const repo = manager.getRepository(Branch);
      for (const item of items) {
        await repo.update(item.id, { displayOrder: item.displayOrder });
      }
    });

    await this.reorderAndNormalize();
    return { success: true };
  }

  private async reorderAndNormalize() {
    const branches = await this.branchRepo.find({
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
    });

    for (let i = 0; i < branches.length; i++) {
      const targetOrder = i + 1;
      if (branches[i].displayOrder !== targetOrder) {
        await this.branchRepo.update(branches[i].id, {
          displayOrder: targetOrder,
        });
      }
    }
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

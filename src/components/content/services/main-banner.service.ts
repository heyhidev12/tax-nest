import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { MainBanner, BannerMediaType } from 'src/libs/entity/main-banner.entity';

export interface CreateBannerDto {
  mediaType: BannerMediaType;
  mediaUrl: string;
  linkUrl?: string;
  displayOrder?: number;
}

@Injectable()
export class MainBannerService {
  constructor(
    @InjectRepository(MainBanner)
    private readonly bannerRepo: Repository<MainBanner>,
  ) {}

  async create(dto: CreateBannerDto) {
    const banner = this.bannerRepo.create(dto);
    return this.bannerRepo.save(banner);
  }

  async findAll(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };
    return this.bannerRepo.find({
      where,
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async findById(id: number) {
    const banner = await this.bannerRepo.findOne({ where: { id } });
    if (!banner) throw new NotFoundException('배너를 찾을 수 없습니다.');
    return banner;
  }

  async update(id: number, data: Partial<MainBanner>) {
    const banner = await this.findById(id);
    Object.assign(banner, data);
    return this.bannerRepo.save(banner);
  }

  async delete(id: number) {
    const banner = await this.findById(id);
    await this.bannerRepo.remove(banner);
    return { success: true };
  }

  async deleteMany(ids: number[]) {
    const banners = await this.bannerRepo.find({ where: { id: In(ids) } });
    if (!banners.length) return { success: true, deleted: 0 };
    await this.bannerRepo.remove(banners);
    return { success: true, deleted: banners.length };
  }

  async toggleActive(id: number) {
    const banner = await this.findById(id);
    banner.isActive = !banner.isActive;
    await this.bannerRepo.save(banner);
    return { success: true, isActive: banner.isActive };
  }

  async updateOrder(items: { id: number; displayOrder: number }[]) {
    for (const item of items) {
      await this.bannerRepo.update(item.id, { displayOrder: item.displayOrder });
    }
    return { success: true };
  }
}



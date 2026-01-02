import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { MainBanner, BannerMediaType } from 'src/libs/entity/main-banner.entity';
import { UploadService } from 'src/libs/upload/upload.service';

export interface CreateBannerDto {
  mediaType: BannerMediaType;
  media: { id: number; url: string };
  linkUrl?: string;
  displayOrder?: number;
}

@Injectable()
export class MainBannerService {
  constructor(
    @InjectRepository(MainBanner)
    private readonly bannerRepo: Repository<MainBanner>,
    private readonly uploadService: UploadService,
    private readonly dataSource: DataSource,
  ) { }

  async create(dto: CreateBannerDto) {
    const allBanners = await this.bannerRepo.find({ order: { displayOrder: 'ASC' } });
    const currentCount = allBanners.length;
    const targetOrder = dto.displayOrder ?? currentCount + 1;

    // Range Validation
    if (targetOrder < 1 || targetOrder > currentCount + 1 || !Number.isInteger(targetOrder)) {
      throw new BadRequestException({
        code: 'DISPLAY_ORDER_OUT_OF_RANGE',
        message: `표시 순서는 1부터 ${currentCount + 1} 사이의 유일한 값이어야 하며, 값은 누락 없이 연속되어야 합니다.`,
      });
    }

    const banner = this.bannerRepo.create({
      mediaType: dto.mediaType,
      media: dto.media,
      linkUrl: dto.linkUrl,
      displayOrder: targetOrder,
    });

    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(MainBanner);
      const saved = await repo.save(banner);

      // Rebuild the list with the new item at target position
      const newList = [...allBanners];
      newList.splice(targetOrder - 1, 0, saved);

      for (let i = 0; i < newList.length; i++) {
        const order = i + 1;
        // Update all items to ensure consistent sequence
        await repo.update(newList[i].id, { displayOrder: order });
      }
    });

    return (await this.bannerRepo.findOne({ where: { media: { url: dto.media.url } }, order: { createdAt: 'DESC' } }))!;
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

    // 1. Handle DisplayOrder Reordering (Drag & Drop Style)
    if (data.displayOrder !== undefined && data.displayOrder !== banner.displayOrder) {
      const allBanners = await this.bannerRepo.find({ order: { displayOrder: 'ASC' } });
      const currentCount = allBanners.length;
      const targetOrder = data.displayOrder;

      // Range Validation
      if (targetOrder < 1 || targetOrder > currentCount || !Number.isInteger(targetOrder)) {
        throw new BadRequestException({
          code: 'DISPLAY_ORDER_OUT_OF_RANGE',
          message: `표시 순서는 1부터 ${currentCount} 사이의 유일한 값이어야 하며, 값은 누락 없이 연속되어야 합니다.`,
        });
      }

      // Remove the current banner and insert at target position
      const otherBanners = allBanners.filter((b) => b.id !== id);
      otherBanners.splice(targetOrder - 1, 0, banner);

      await this.dataSource.transaction(async (manager) => {
        const repo = manager.getRepository(MainBanner);
        for (let i = 0; i < otherBanners.length; i++) {
          const order = i + 1;
          await repo.update(otherBanners[i].id, { displayOrder: order });
        }
      });

      // Update local banner object to reflect the new state for the final findById call
      banner.displayOrder = targetOrder;
    }

    // 2. Handle Other Field Updates
    const updatedData = { ...data };
    delete updatedData.displayOrder;

    if (Object.keys(updatedData).length > 0) {
      Object.assign(banner, updatedData);
      await this.bannerRepo.save(banner);
    }

    return this.findById(id);
  }

  async delete(id: number) {
    const banner = await this.findById(id);

    // Cleanup S3 file before deleting entity
    if (banner.media) {
      await this.uploadService.deleteFileByUrl(banner.media.url);
    }

    await this.bannerRepo.remove(banner);
    await this.reorderAndNormalize();
    return { success: true };
  }

  async deleteMany(ids: number[]) {
    const banners = await this.bannerRepo.find({ where: { id: In(ids) } });
    if (!banners.length) return { success: true, deleted: 0 };
    await this.bannerRepo.remove(banners);
    await this.reorderAndNormalize();
    return { success: true, deleted: banners.length };
  }

  async toggleActive(id: number) {
    const banner = await this.findById(id);
    banner.isActive = !banner.isActive;
    await this.bannerRepo.save(banner);
    return { success: true, isActive: banner.isActive };
  }

  async updateOrder(items: { id: number; displayOrder: number }[]) {
    // Note: This bulk update is typically used for resetting the entire list order.
    // For drag-and-drop, we prioritize the provided orders and then normalize.
    const allBanners = await this.bannerRepo.find({ order: { displayOrder: 'ASC' } });
    if (!allBanners.length) return { success: true };

    // 1. Validate range and basic constraints first
    for (const item of items) {
      if (item.displayOrder < 1 || item.displayOrder > allBanners.length || !Number.isInteger(item.displayOrder)) {
        throw new BadRequestException({
          code: 'DISPLAY_ORDER_OUT_OF_RANGE',
          message: `표시 순서는 1부터 ${allBanners.length} 사이의 값이어야 합니다.`,
        });
      }
    }

    // 2. Validate uniqueness and continuity within the input
    if (items.length === allBanners.length) {
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
      const repo = manager.getRepository(MainBanner);

      // We apply the updates and then immediately normalize to ensure consistency
      for (const item of items) {
        await repo.update(item.id, { displayOrder: item.displayOrder });
      }
    });

    await this.reorderAndNormalize();
    return { success: true };
  }


  private async reorderAndNormalize() {
    const banners = await this.bannerRepo.find({
      order: { displayOrder: 'ASC', updatedAt: 'DESC' },
    });

    for (let i = 0; i < banners.length; i++) {
      const targetOrder = i + 1;
      if (banners[i].displayOrder !== targetOrder) {
        await this.bannerRepo.update(banners[i].id, {
          displayOrder: targetOrder,
        });
      }
    }
  }
}



















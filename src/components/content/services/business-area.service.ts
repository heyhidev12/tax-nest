import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { BusinessArea, BusinessAreaContentType } from 'src/libs/entity/business-area.entity';

interface BusinessAreaListOptions {
  search?: string;
  contentType?: BusinessAreaContentType;
  majorCategory?: string;
  isExposed?: boolean;
  isMainExposed?: boolean;
  sort?: 'latest' | 'oldest' | 'order';
  page?: number;
  limit?: number;
  includeHidden?: boolean;
}

@Injectable()
export class BusinessAreaService {
  constructor(
    @InjectRepository(BusinessArea)
    private readonly areaRepo: Repository<BusinessArea>,
  ) {}

  async create(data: Partial<BusinessArea>) {
    const area = this.areaRepo.create(data);
    return this.areaRepo.save(area);
  }

  async findAll(options: BusinessAreaListOptions = {}) {
    const { 
      search, 
      contentType, 
      majorCategory, 
      isExposed,
      isMainExposed,
      sort = 'order',
      page = 1, 
      limit = 20, 
      includeHidden = false 
    } = options;
    
    const qb = this.areaRepo.createQueryBuilder('area');

    // 노출 여부 필터
    if (!includeHidden) {
      qb.andWhere('area.isExposed = :isExposed', { isExposed: true });
    } else if (isExposed !== undefined) {
      qb.andWhere('area.isExposed = :isExposed', { isExposed });
    }

    // 메인 노출 필터
    if (isMainExposed !== undefined) {
      qb.andWhere('area.isMainExposed = :isMainExposed', { isMainExposed });
    }

    // 콘텐츠 타입 필터
    if (contentType) {
      qb.andWhere('area.contentType = :contentType', { contentType });
    }

    // 대분류 필터
    if (majorCategory) {
      qb.andWhere('area.majorCategory = :majorCategory', { majorCategory });
    }

    // 업무분야명 검색
    if (search) {
      qb.andWhere('area.name LIKE :search', { search: `%${search}%` });
    }

    // 정렬
    if (sort === 'order') {
      qb.orderBy('area.displayOrder', 'ASC').addOrderBy('area.createdAt', 'DESC');
    } else if (sort === 'latest') {
      qb.orderBy('area.createdAt', 'DESC');
    } else {
      qb.orderBy('area.createdAt', 'ASC');
    }

    // 페이지네이션
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    // 응답 포맷: No, 노출순서, 업무분야명, 업무분야(대분류), 업무분야(중분류), Youtube, 메인노출여부, 노출여부, 등록일시
    // 번호는 최신 등록일 기준으로 순차 번호 부여 (등록일 DESC 기준)
    const formattedItems = items.map((item, index) => {
      // 최신순이면 큰 번호부터, 오래된순이면 작은 번호부터
      const no = sort === 'latest' 
        ? total - ((page - 1) * limit + index)
        : (page - 1) * limit + index + 1;

      // YouTube URL 개수 계산 (여러 개일 수 있음 - JSON 배열 또는 콤마 구분)
      let youtubeCount = 0;
      if (item.youtubeUrl) {
        try {
          // JSON 배열인 경우
          const parsed = JSON.parse(item.youtubeUrl);
          youtubeCount = Array.isArray(parsed) ? parsed.length : 1;
        } catch {
          // 콤마 구분 문자열인 경우
          youtubeCount = item.youtubeUrl.split(',').filter(url => url.trim()).length;
        }
      }

      return {
        no,
        id: item.id,
        contentType: item.contentType,
        contentTypeLabel: this.getContentTypeLabel(item.contentType),
        name: item.name,
        subDescription: item.subDescription,
        majorCategory: item.majorCategory,
        minorCategory: item.minorCategory,
        imageUrl: item.imageUrl,
        youtubeUrl: item.youtubeUrl,
        youtubeCount,
        displayOrder: item.displayOrder,
        isMainExposed: item.isMainExposed,
        mainExposedLabel: item.isMainExposed ? 'Y' : 'N',
        isExposed: item.isExposed,
        exposedLabel: item.isExposed ? 'Y' : 'N',
        createdAt: item.createdAt,
        createdAtFormatted: this.formatDateTime(item.createdAt),
      };
    });

    return { items: formattedItems, total, page, limit };
  }

  async findMainExposed() {
    return this.areaRepo.find({
      where: { isExposed: true, isMainExposed: true },
      order: { displayOrder: 'ASC' },
    });
  }

  async findById(id: number) {
    const area = await this.areaRepo.findOne({ where: { id } });
    if (!area) throw new NotFoundException('업무분야를 찾을 수 없습니다.');
    
    return {
      ...area,
      contentTypeLabel: this.getContentTypeLabel(area.contentType),
      mainExposedLabel: area.isMainExposed ? 'Y' : 'N',
      exposedLabel: area.isExposed ? 'Y' : 'N',
      createdAtFormatted: this.formatDateTime(area.createdAt),
      updatedAtFormatted: this.formatDateTime(area.updatedAt),
    };
  }

  async update(id: number, data: Partial<BusinessArea>) {
    const area = await this.areaRepo.findOne({ where: { id } });
    if (!area) throw new NotFoundException('업무분야를 찾을 수 없습니다.');
    Object.assign(area, data);
    return this.areaRepo.save(area);
  }

  async delete(id: number) {
    const area = await this.areaRepo.findOne({ where: { id } });
    if (!area) throw new NotFoundException('업무분야를 찾을 수 없습니다.');
    await this.areaRepo.remove(area);
    return { success: true, message: '삭제가 완료되었습니다.' };
  }

  async deleteMany(ids: number[]) {
    const areas = await this.areaRepo.find({ where: { id: In(ids) } });
    if (!areas.length) return { success: true, deleted: 0 };
    await this.areaRepo.remove(areas);
    return { success: true, deleted: areas.length, message: '삭제가 완료되었습니다.' };
  }

  async toggleExposure(id: number) {
    const area = await this.areaRepo.findOne({ where: { id } });
    if (!area) throw new NotFoundException('업무분야를 찾을 수 없습니다.');
    area.isExposed = !area.isExposed;
    await this.areaRepo.save(area);
    return { success: true, isExposed: area.isExposed };
  }

  async toggleMainExposure(id: number) {
    const area = await this.areaRepo.findOne({ where: { id } });
    if (!area) throw new NotFoundException('업무분야를 찾을 수 없습니다.');
    area.isMainExposed = !area.isMainExposed;
    await this.areaRepo.save(area);
    return { success: true, isMainExposed: area.isMainExposed };
  }

  async updateOrder(items: { id: number; displayOrder: number }[]) {
    for (const item of items) {
      await this.areaRepo.update(item.id, { displayOrder: item.displayOrder });
    }
    return { success: true };
  }

  // 대분류 카테고리 목록 조회 (드롭다운용)
  async getMajorCategories(): Promise<string[]> {
    const result = await this.areaRepo
      .createQueryBuilder('area')
      .select('DISTINCT area.majorCategory', 'majorCategory')
      .getRawMany();
    return result.map((r) => r.majorCategory).filter(Boolean);
  }

  // 중분류 카테고리 목록 조회 (드롭다운용)
  async getMinorCategories(majorCategory: string): Promise<string[]> {
    const result = await this.areaRepo
      .createQueryBuilder('area')
      .select('DISTINCT area.minorCategory', 'minorCategory')
      .where('area.majorCategory = :majorCategory', { majorCategory })
      .getRawMany();
    return result.map((r) => r.minorCategory).filter(Boolean);
  }

  // 콘텐츠 타입 라벨
  private getContentTypeLabel(contentType: BusinessAreaContentType): string {
    switch (contentType) {
      case BusinessAreaContentType.A:
        return 'A타입 (업종별)';
      case BusinessAreaContentType.B:
        return 'B타입 (컨설팅)';
      case BusinessAreaContentType.C:
        return 'C타입 (커스텀)';
      default:
        return '기타';
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

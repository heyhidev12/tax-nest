import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AwardYear, Award } from 'src/libs/entity/award.entity';

interface YearListOptions {
  isExposed?: boolean;
  isMainExposed?: boolean;
  sort?: 'latest' | 'oldest' | 'order';
  page?: number;
  limit?: number;
  includeHidden?: boolean;
}

interface AwardListOptions {
  isExposed?: boolean;
  isMainExposed?: boolean;
  sort?: 'latest' | 'oldest' | 'order';
  includeHidden?: boolean;
}

interface PublicAwardListOptions {
  isMainExposed?: boolean;
  sort?: 'latest' | 'oldest' | 'order';
  page?: number;
  limit?: number;
}

@Injectable()
export class AwardService {
  constructor(
    @InjectRepository(AwardYear)
    private readonly yearRepo: Repository<AwardYear>,
    @InjectRepository(Award)
    private readonly awardRepo: Repository<Award>,
  ) { }

  // === Year CRUD ===
  async createYear(yearName: string, isMainExposed = false, isExposed = true) {
    const entity = this.yearRepo.create({ yearName, isMainExposed, isExposed });
    return this.yearRepo.save(entity);
  }

  async findAllYears(options: YearListOptions = {}) {
    const {
      isExposed,
      isMainExposed,
      sort = 'order',
      page = 1,
      limit = 10,
      includeHidden = false
    } = options;

    const qb = this.yearRepo.createQueryBuilder('year')
      .leftJoinAndSelect('year.awards', 'awards');

    if (!includeHidden) {
      qb.andWhere('year.isExposed = :isExposed', { isExposed: true });
    } else if (isExposed !== undefined) {
      qb.andWhere('year.isExposed = :isExposed', { isExposed });
    }

    if (isMainExposed !== undefined) {
      qb.andWhere('year.isMainExposed = :isMainExposed', { isMainExposed });
    }

    // 정렬
    if (sort === 'order') {
      qb.orderBy('year.displayOrder', 'ASC').addOrderBy('year.createdAt', 'DESC');
    } else if (sort === 'latest') {
      qb.orderBy('year.createdAt', 'DESC');
    } else {
      qb.orderBy('year.createdAt', 'ASC');
    }

    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    // 응답 포맷: No, 노출순서, 체크박스, 년도 명, 노출여부, 등록일시
    const formattedItems = items.map((item) => ({
      id: item.id,
      yearName: item.yearName,
      displayOrder: item.displayOrder,
      isMainExposed: item.isMainExposed,
      isExposed: item.isExposed,
      awardCount: item.awards?.length || 0,
      createdAt: item.createdAt,
    }));

    return { items: formattedItems, total, page, limit };
  }

  async findYearById(id: number) {
    const year = await this.yearRepo.findOne({
      where: { id },
      relations: ['awards'],
    });
    if (!year) throw new NotFoundException('연도를 찾을 수 없습니다.');
    return year;
  }

  async getYearDetail(id: number) {
    const year = await this.findYearById(id);

    // 아이템 정렬 및 포맷
    const formattedAwards = (year.awards || [])
      .sort((a, b) => a.displayOrder - b.displayOrder || b.createdAt.getTime() - a.createdAt.getTime())
      .map((award, index) => ({
        no: year.awards.length - index,
        id: award.id,
        name: award.name,
        source: award.source,
        image: award.image,
        displayOrder: award.displayOrder,
        isMainExposed: award.isMainExposed,
        isExposed: award.isExposed,
        createdAt: award.createdAt,
      }));

    return {
      id: year.id,
      yearName: year.yearName,
      displayOrder: year.displayOrder,
      isMainExposed: year.isMainExposed,
      isExposed: year.isExposed,
      awards: formattedAwards,
      createdAt: year.createdAt,
    };
  }

  async updateYear(id: number, data: Partial<AwardYear>) {
    const year = await this.yearRepo.findOne({ where: { id } });
    if (!year) throw new NotFoundException('연도를 찾을 수 없습니다.');
    Object.assign(year, data);
    return this.yearRepo.save(year);
  }

  async deleteYear(id: number) {
    const year = await this.yearRepo.findOne({ where: { id } });
    if (!year) throw new NotFoundException('연도를 찾을 수 없습니다.');
    await this.yearRepo.remove(year);
    return { success: true, message: '삭제가 완료되었습니다.' };
  }

  async deleteYears(ids: number[]) {
    const years = await this.yearRepo.find({ where: { id: In(ids) } });
    if (!years.length) return { success: true, deleted: 0 };
    await this.yearRepo.remove(years);
    return { success: true, deleted: years.length, message: '삭제가 완료되었습니다.' };
  }

  async toggleYearExposure(id: number) {
    const year = await this.yearRepo.findOne({ where: { id } });
    if (!year) throw new NotFoundException('연도를 찾을 수 없습니다.');
    year.isExposed = !year.isExposed;
    await this.yearRepo.save(year);
    return { success: true, isExposed: year.isExposed };
  }

  async toggleYearMainExposure(id: number) {
    const year = await this.yearRepo.findOne({ where: { id } });
    if (!year) throw new NotFoundException('연도를 찾을 수 없습니다.');
    year.isMainExposed = !year.isMainExposed;
    await this.yearRepo.save(year);
    return { success: true, isMainExposed: year.isMainExposed };
  }

  async updateYearOrder(items: { id: number; displayOrder: number }[]) {
    for (const item of items) {
      await this.yearRepo.update(item.id, { displayOrder: item.displayOrder });
    }
    return { success: true };
  }

  // === Award CRUD ===
  async createAward(awardYearId: number, data: {
    name: string;
    source: string;
    image: { id: number; url: string };
    isMainExposed?: boolean;
    isExposed?: boolean;
  }) {
    const year = await this.yearRepo.findOne({ where: { id: awardYearId } });
    if (!year) throw new NotFoundException('연도를 찾을 수 없습니다.');

    const award = this.awardRepo.create({
      awardYearId,
      name: data.name,
      source: data.source,
      image: data.image,
      isMainExposed: data.isMainExposed ?? false,
      isExposed: data.isExposed ?? true,
    });
    return this.awardRepo.save(award);
  }

  async findAwardsByYear(awardYearId: number, options: AwardListOptions = {}) {
    const { isExposed, isMainExposed, sort = 'order', includeHidden = false } = options;

    const qb = this.awardRepo.createQueryBuilder('award')
      .where('award.awardYearId = :awardYearId', { awardYearId });

    if (!includeHidden) {
      qb.andWhere('award.isExposed = :isExposed', { isExposed: true });
    } else if (isExposed !== undefined) {
      qb.andWhere('award.isExposed = :isExposed', { isExposed });
    }

    if (isMainExposed !== undefined) {
      qb.andWhere('award.isMainExposed = :isMainExposed', { isMainExposed });
    }

    if (sort === 'order') {
      qb.orderBy('award.displayOrder', 'ASC').addOrderBy('award.createdAt', 'DESC');
    } else if (sort === 'latest') {
      qb.orderBy('award.createdAt', 'DESC');
    } else {
      qb.orderBy('award.createdAt', 'ASC');
    }

    const awards = await qb.getMany();

    return awards.map((award, index) => ({
      no: awards.length - index,
      id: award.id,
      name: award.name,
      source: award.source,
      image: award.image,
      displayOrder: award.displayOrder,
      isMainExposed: award.isMainExposed,
      isExposed: award.isExposed,
      createdAt: award.createdAt,
    }));
  }

  async findAllAwardsPublic(options: PublicAwardListOptions = {}) {
    const {
      isMainExposed,
      sort = 'latest',
      page = 1,
      limit = 20,
    } = options;

    const qb = this.awardRepo.createQueryBuilder('award')
      .leftJoinAndSelect('award.awardYear', 'year')
      .where('award.isExposed = :isExposed', { isExposed: true });

    if (isMainExposed !== undefined) {
      qb.andWhere('award.isMainExposed = :isMainExposed', { isMainExposed });
    }

    // 정렬
    if (sort === 'order') {
      qb.orderBy('award.displayOrder', 'ASC').addOrderBy('award.createdAt', 'DESC');
    } else if (sort === 'latest') {
      qb.orderBy('award.createdAt', 'DESC');
    } else {
      qb.orderBy('award.createdAt', 'ASC');
    }

    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    const formattedItems = items.map((award) => {
      return {
        id: award.id,
        name: award.name,
        source: award.source,
        image: award.image,
        yearName: award.awardYear?.yearName || '-',
        yearId: award.awardYearId,
        displayOrder: award.displayOrder,
        isMainExposed: award.isMainExposed,
      };
    });

    return { items: formattedItems, total, page, limit };
  }

  async findAwardById(id: number) {
    const award = await this.awardRepo.findOne({
      where: { id },
      relations: ['awardYear'],
    });
    if (!award) throw new NotFoundException('수상/인증을 찾을 수 없습니다.');
    return {
      ...award,
    };
  }

  async updateAward(id: number, data: Partial<Award>) {
    const award = await this.awardRepo.findOne({ where: { id } });
    if (!award) throw new NotFoundException('수상/인증을 찾을 수 없습니다.');
    Object.assign(award, data);
    return this.awardRepo.save(award);
  }

  async deleteAward(id: number) {
    const award = await this.awardRepo.findOne({ where: { id } });
    if (!award) throw new NotFoundException('수상/인증을 찾을 수 없습니다.');
    await this.awardRepo.remove(award);
    return { success: true, message: '삭제가 완료되었습니다.' };
  }

  async deleteAwards(ids: number[]) {
    const awards = await this.awardRepo.find({ where: { id: In(ids) } });
    if (!awards.length) return { success: true, deleted: 0 };
    await this.awardRepo.remove(awards);
    return { success: true, deleted: awards.length, message: '삭제가 완료되었습니다.' };
  }

  async toggleAwardExposure(id: number) {
    const award = await this.awardRepo.findOne({ where: { id } });
    if (!award) throw new NotFoundException('수상/인증을 찾을 수 없습니다.');
    award.isExposed = !award.isExposed;
    await this.awardRepo.save(award);
    return { success: true, isExposed: award.isExposed };
  }

  async toggleAwardMainExposure(id: number) {
    const award = await this.awardRepo.findOne({ where: { id } });
    if (!award) throw new NotFoundException('수상/인증을 찾을 수 없습니다.');
    award.isMainExposed = !award.isMainExposed;
    await this.awardRepo.save(award);
    return { success: true, isMainExposed: award.isMainExposed };
  }

  async updateAwardOrder(items: { id: number; displayOrder: number }[]) {
    for (const item of items) {
      await this.awardRepo.update(item.id, { displayOrder: item.displayOrder });
    }
    return { success: true };
  }

  /**
   * Get all exposed awards grouped by year (for user pages)
   * Returns data grouped by year, sorted by year descending, items by createdAt descending
   */
  async getAllAwardsGroupedByYear() {
    // Fetch all exposed awards with their year relations
    const awards = await this.awardRepo.find({
      where: { isExposed: true },
      relations: ['awardYear'],
      order: { createdAt: 'DESC' },
    });

    // Filter only awards where the year is also exposed
    const exposedAwards = awards.filter(
      (award) => award.awardYear && award.awardYear.isExposed,
    );

    // Group by year (extract year number from yearName)
    const yearMap = new Map<number, Award[]>();

    exposedAwards.forEach((award) => {
      // Extract year number from yearName (e.g., "2025" -> 2025)
      const yearNum = parseInt(award.awardYear.yearName, 10);
      if (!isNaN(yearNum)) {
        if (!yearMap.has(yearNum)) {
          yearMap.set(yearNum, []);
        }
        yearMap.get(yearNum)!.push(award);
      }
    });

    // Convert to array format, sorted by year descending
    const groupedData = Array.from(yearMap.entries())
      .sort((a, b) => b[0] - a[0]) // Sort years descending
      .map(([year, items]) => ({
        year,
        items: items
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) // Sort items by createdAt descending
          .map((award) => ({
            id: award.id,
            name: award.name,
            source: award.source,
            image: award.image,
            isMainExposed: award.isMainExposed,
            displayOrder: award.displayOrder,
          })),
      }));

    return groupedData;
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

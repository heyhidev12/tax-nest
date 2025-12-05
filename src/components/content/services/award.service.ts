import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AwardYear, Award } from 'src/libs/entity/award.entity';

@Injectable()
export class AwardService {
  constructor(
    @InjectRepository(AwardYear)
    private readonly yearRepo: Repository<AwardYear>,
    @InjectRepository(Award)
    private readonly awardRepo: Repository<Award>,
  ) {}

  // === Year CRUD ===
  async createYear(year: number) {
    const entity = this.yearRepo.create({ year });
    return this.yearRepo.save(entity);
  }

  async findAllYears(includeHidden = false) {
    const where = includeHidden ? {} : { isExposed: true };
    return this.yearRepo.find({
      where,
      order: { year: 'DESC' },
    });
  }

  async findYearById(id: number) {
    const year = await this.yearRepo.findOne({ where: { id } });
    if (!year) throw new NotFoundException('연도를 찾을 수 없습니다.');
    return year;
  }

  async updateYear(id: number, data: Partial<AwardYear>) {
    const year = await this.findYearById(id);
    Object.assign(year, data);
    return this.yearRepo.save(year);
  }

  async deleteYear(id: number) {
    const year = await this.findYearById(id);
    await this.yearRepo.remove(year);
    return { success: true };
  }

  async deleteYears(ids: number[]) {
    const years = await this.yearRepo.find({ where: { id: In(ids) } });
    if (!years.length) return { success: true, deleted: 0 };
    await this.yearRepo.remove(years);
    return { success: true, deleted: years.length };
  }

  // === Award CRUD ===
  async createAward(awardYearId: number, data: { name: string; source: string; imageUrl: string }) {
    await this.findYearById(awardYearId);
    const award = this.awardRepo.create({
      awardYearId,
      ...data,
    });
    return this.awardRepo.save(award);
  }

  async findAwardsByYear(awardYearId: number, includeHidden = false) {
    const where: any = { awardYearId };
    if (!includeHidden) where.isExposed = true;
    return this.awardRepo.find({
      where,
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async findAwardById(id: number) {
    const award = await this.awardRepo.findOne({ where: { id } });
    if (!award) throw new NotFoundException('수상/인증을 찾을 수 없습니다.');
    return award;
  }

  async updateAward(id: number, data: Partial<Award>) {
    const award = await this.findAwardById(id);
    Object.assign(award, data);
    return this.awardRepo.save(award);
  }

  async deleteAward(id: number) {
    const award = await this.findAwardById(id);
    await this.awardRepo.remove(award);
    return { success: true };
  }

  async deleteAwards(ids: number[]) {
    const awards = await this.awardRepo.find({ where: { id: In(ids) } });
    if (!awards.length) return { success: true, deleted: 0 };
    await this.awardRepo.remove(awards);
    return { success: true, deleted: awards.length };
  }

  async toggleAwardExposure(id: number) {
    const award = await this.findAwardById(id);
    award.isExposed = !award.isExposed;
    await this.awardRepo.save(award);
    return { success: true, isExposed: award.isExposed };
  }
}


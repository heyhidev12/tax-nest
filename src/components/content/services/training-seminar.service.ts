import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { 
  TrainingSeminar, 
  TrainingSeminarApplication, 
  TrainingSeminarType,
  ApplicationStatus 
} from 'src/libs/entity/training-seminar.entity';

interface TrainingSeminarListOptions {
  search?: string;
  type?: TrainingSeminarType;
  page?: number;
  limit?: number;
  includeHidden?: boolean;
}

@Injectable()
export class TrainingSeminarService {
  constructor(
    @InjectRepository(TrainingSeminar)
    private readonly seminarRepo: Repository<TrainingSeminar>,
    @InjectRepository(TrainingSeminarApplication)
    private readonly appRepo: Repository<TrainingSeminarApplication>,
  ) {}

  // === Seminar CRUD ===
  async create(data: Partial<TrainingSeminar>) {
    const seminar = this.seminarRepo.create(data);
    return this.seminarRepo.save(seminar);
  }

  async findAll(options: TrainingSeminarListOptions = {}) {
    const { search, type, page = 1, limit = 20, includeHidden = false } = options;
    
    const where: any = {};
    if (!includeHidden) where.isExposed = true;
    if (type) where.type = type;

    if (search) {
      const [items, total] = await this.seminarRepo
        .createQueryBuilder('seminar')
        .where(where)
        .andWhere('seminar.name LIKE :search', { search: `%${search}%` })
        .orderBy('seminar.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();
      return { items, total, page, limit };
    }

    const [items, total] = await this.seminarRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async findById(id: number) {
    const seminar = await this.seminarRepo.findOne({ 
      where: { id },
      relations: ['applications'],
    });
    if (!seminar) throw new NotFoundException('교육/세미나를 찾을 수 없습니다.');
    return seminar;
  }

  async update(id: number, data: Partial<TrainingSeminar>) {
    const seminar = await this.findById(id);
    Object.assign(seminar, data);
    return this.seminarRepo.save(seminar);
  }

  async delete(id: number) {
    const seminar = await this.findById(id);
    await this.seminarRepo.remove(seminar);
    return { success: true };
  }

  async deleteMany(ids: number[]) {
    const seminars = await this.seminarRepo.find({ where: { id: In(ids) } });
    if (!seminars.length) return { success: true, deleted: 0 };
    await this.seminarRepo.remove(seminars);
    return { success: true, deleted: seminars.length };
  }

  async toggleExposure(id: number) {
    const seminar = await this.seminarRepo.findOne({ where: { id } });
    if (!seminar) throw new NotFoundException('교육/세미나를 찾을 수 없습니다.');
    seminar.isExposed = !seminar.isExposed;
    await this.seminarRepo.save(seminar);
    return { success: true, isExposed: seminar.isExposed };
  }

  // === Application CRUD ===
  async createApplication(trainingSeminarId: number, data: Partial<TrainingSeminarApplication>) {
    await this.findById(trainingSeminarId);
    const app = this.appRepo.create({ trainingSeminarId, ...data });
    return this.appRepo.save(app);
  }

  async findApplications(trainingSeminarId: number, page = 1, limit = 20) {
    const [items, total] = await this.appRepo.findAndCount({
      where: { trainingSeminarId },
      order: { appliedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async updateApplicationStatus(id: number, status: ApplicationStatus) {
    const app = await this.appRepo.findOne({ where: { id } });
    if (!app) throw new NotFoundException('신청을 찾을 수 없습니다.');
    app.status = status;
    await this.appRepo.save(app);
    return { success: true };
  }

  async deleteApplication(id: number) {
    const app = await this.appRepo.findOne({ where: { id } });
    if (!app) throw new NotFoundException('신청을 찾을 수 없습니다.');
    await this.appRepo.remove(app);
    return { success: true };
  }
}


import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { 
  TrainingSeminar, 
  TrainingSeminarApplication, 
  TrainingSeminarType,
  RecruitmentType,
  ApplicationStatus,
  TargetMemberType,
} from 'src/libs/entity/training-seminar.entity';

interface TrainingSeminarListOptions {
  search?: string;
  type?: TrainingSeminarType;
  recruitmentType?: RecruitmentType;
  targetMemberType?: TargetMemberType;
  isExposed?: boolean;
  isRecommended?: boolean;
  sort?: 'latest' | 'oldest';
  page?: number;
  limit?: number;
  includeHidden?: boolean;
}

interface ApplicationListOptions {
  search?: string;
  status?: ApplicationStatus;
  sort?: 'latest' | 'oldest';
  page?: number;
  limit?: number;
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
    // 선착순일 경우 정원 필수
    if (data.recruitmentType === RecruitmentType.FIRST_COME && !data.quota) {
      throw new BadRequestException('선착순 모집의 경우 정원을 입력해주세요.');
    }
    const seminar = this.seminarRepo.create(data);
    return this.seminarRepo.save(seminar);
  }

  async findAll(options: TrainingSeminarListOptions = {}) {
    const { 
      search, 
      type, 
      recruitmentType,
      targetMemberType,
      isExposed,
      isRecommended,
      sort = 'latest',
      page = 1, 
      limit = 20, 
      includeHidden = false 
    } = options;
    
    const qb = this.seminarRepo.createQueryBuilder('seminar')
      .leftJoinAndSelect('seminar.applications', 'applications');

    // 노출 여부 필터
    if (!includeHidden) {
      qb.andWhere('seminar.isExposed = :isExposed', { isExposed: true });
    } else if (isExposed !== undefined) {
      qb.andWhere('seminar.isExposed = :isExposed', { isExposed });
    }

    // 추천 세미나 필터
    if (isRecommended !== undefined) {
      qb.andWhere('seminar.isRecommended = :isRecommended', { isRecommended });
    }

    // 유형 필터
    if (type) {
      qb.andWhere('seminar.type = :type', { type });
    }

    // 모집 유형 필터
    if (recruitmentType) {
      qb.andWhere('seminar.recruitmentType = :recruitmentType', { recruitmentType });
    }

    // 대상 회원 유형 필터
    if (targetMemberType) {
      qb.andWhere('seminar.targetMemberType = :targetMemberType', { targetMemberType });
    }

    // 이름 검색
    if (search) {
      qb.andWhere('seminar.name LIKE :search', { search: `%${search}%` });
    }

    // 정렬 (기본: 최신순)
    qb.orderBy('seminar.createdAt', sort === 'latest' ? 'DESC' : 'ASC');

    // 페이지네이션
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    // 응답 포맷: No, 교육/세미나명, 교육/세미나유형, 모집유형, 회원유형, 이미지, 교육일자, 참여시간, 노출여부, 등록일시
    // 번호는 최신 등록일 기준으로 순차 번호 부여 (등록일 DESC 기준)
    const formattedItems = items.map((item, index) => {
      // 최신순이면 큰 번호부터, 오래된순이면 작은 번호부터
      const no = sort === 'latest' 
        ? total - ((page - 1) * limit + index)
        : (page - 1) * limit + index + 1;

      return {
        no,
        id: item.id,
        name: item.name,
        type: item.type,
        typeLabel: this.getTypeLabel(item.type),
        recruitmentType: item.recruitmentType,
        recruitmentTypeLabel: this.getRecruitmentTypeLabel(item.recruitmentType),
        recruitmentEndDate: item.recruitmentEndDate,
        recruitmentEndDateFormatted: this.formatRecruitmentDate(item.recruitmentEndDate),
        imageUrl: item.imageUrl,
        targetMemberType: item.targetMemberType,
        targetMemberTypeLabel: this.getTargetMemberTypeLabel(item.targetMemberType),
        startDate: item.startDate,
        endDate: item.endDate,
        trainingDateFormatted: `${this.formatDate(item.startDate)} ~ ${this.formatDate(item.endDate)}`,
        participationTime: item.participationTime,
        location: item.location,
        quota: item.quota,
        applicationCount: item.applications?.length || 0,
        isExposed: item.isExposed,
        exposedLabel: item.isExposed ? 'Y' : 'N',
        isRecommended: item.isRecommended,
        createdAt: item.createdAt,
        createdAtFormatted: this.formatDateTime(item.createdAt),
      };
    });

    return { items: formattedItems, total, page, limit };
  }

  // 추천 세미나 목록
  async findRecommended() {
    return this.seminarRepo.find({
      where: { isExposed: true, isRecommended: true },
      order: { createdAt: 'DESC' },
    });
  }

  // 신규 교육 목록 (7일 이내)
  async findNewTrainings(limit = 10) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return this.seminarRepo
      .createQueryBuilder('seminar')
      .where('seminar.isExposed = :isExposed', { isExposed: true })
      .andWhere('seminar.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
      .orderBy('seminar.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async findById(id: number) {
    const seminar = await this.seminarRepo.findOne({ 
      where: { id },
      relations: ['applications'],
    });
    if (!seminar) throw new NotFoundException('교육/세미나를 찾을 수 없습니다.');
    
    return {
      ...seminar,
      typeLabel: this.getTypeLabel(seminar.type),
      recruitmentTypeLabel: this.getRecruitmentTypeLabel(seminar.recruitmentType),
      recruitmentEndDateFormatted: this.formatRecruitmentDate(seminar.recruitmentEndDate),
      targetMemberTypeLabel: this.getTargetMemberTypeLabel(seminar.targetMemberType),
      trainingDateFormatted: `${this.formatDate(seminar.startDate)} ~ ${this.formatDate(seminar.endDate)}`,
      exposedLabel: seminar.isExposed ? 'Y' : 'N',
      applicationCount: seminar.applications?.length || 0,
      createdAtFormatted: this.formatDateTime(seminar.createdAt),
      updatedAtFormatted: this.formatDateTime(seminar.updatedAt),
    };
  }

  async update(id: number, data: Partial<TrainingSeminar>) {
    const seminar = await this.seminarRepo.findOne({ where: { id } });
    if (!seminar) throw new NotFoundException('교육/세미나를 찾을 수 없습니다.');
    Object.assign(seminar, data);
    return this.seminarRepo.save(seminar);
  }

  async delete(id: number) {
    const seminar = await this.seminarRepo.findOne({ where: { id } });
    if (!seminar) throw new NotFoundException('교육/세미나를 찾을 수 없습니다.');
    await this.seminarRepo.remove(seminar);
    return { success: true, message: '삭제가 완료되었습니다.' };
  }

  async deleteMany(ids: number[]) {
    const seminars = await this.seminarRepo.find({ where: { id: In(ids) } });
    if (!seminars.length) return { success: true, deleted: 0 };
    await this.seminarRepo.remove(seminars);
    return { success: true, deleted: seminars.length, message: '삭제가 완료되었습니다.' };
  }

  async toggleExposure(id: number) {
    const seminar = await this.seminarRepo.findOne({ where: { id } });
    if (!seminar) throw new NotFoundException('교육/세미나를 찾을 수 없습니다.');
    seminar.isExposed = !seminar.isExposed;
    await this.seminarRepo.save(seminar);
    return { success: true, isExposed: seminar.isExposed };
  }

  async toggleRecommended(id: number) {
    const seminar = await this.seminarRepo.findOne({ where: { id } });
    if (!seminar) throw new NotFoundException('교육/세미나를 찾을 수 없습니다.');
    seminar.isRecommended = !seminar.isRecommended;
    await this.seminarRepo.save(seminar);
    return { success: true, isRecommended: seminar.isRecommended };
  }

  // === Application CRUD ===
  async createApplication(trainingSeminarId: number, data: Partial<TrainingSeminarApplication>) {
    const seminar = await this.seminarRepo.findOne({ 
      where: { id: trainingSeminarId },
      relations: ['applications'],
    });
    if (!seminar) throw new NotFoundException('교육/세미나를 찾을 수 없습니다.');

    // 선착순일 경우 정원 체크
    if (seminar.recruitmentType === RecruitmentType.FIRST_COME && seminar.quota) {
      const currentCount = seminar.applications?.length || 0;
      if (currentCount >= seminar.quota) {
        throw new BadRequestException('모집 정원이 마감되었습니다.');
      }
    }

    const app = this.appRepo.create({ 
      trainingSeminarId, 
      ...data,
      // 선착순일 경우 바로 확정
      status: seminar.recruitmentType === RecruitmentType.FIRST_COME 
        ? ApplicationStatus.CONFIRMED 
        : ApplicationStatus.WAITING,
    });
    return this.appRepo.save(app);
  }

  async findApplications(trainingSeminarId: number, options: ApplicationListOptions = {}) {
    const { search, status, sort = 'latest', page = 1, limit = 20 } = options;

    const qb = this.appRepo.createQueryBuilder('app')
      .leftJoinAndSelect('app.trainingSeminar', 'seminar')
      .where('app.trainingSeminarId = :trainingSeminarId', { trainingSeminarId });

    // 이름 검색
    if (search) {
      qb.andWhere('app.name LIKE :search', { search: `%${search}%` });
    }

    // 상태 필터
    if (status) {
      qb.andWhere('app.status = :status', { status });
    }

    // 정렬
    qb.orderBy('app.appliedAt', sort === 'latest' ? 'DESC' : 'ASC');

    // 페이지네이션
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    // 응답 포맷: No, 이름, 휴대폰번호, 이메일, 교육/세미나명, 참여일자, 참여시간, 참석인원, 신청상태, 신청일시
    // 번호는 최신 등록일 기준으로 순차 번호 부여 (등록일 DESC 기준)
    const formattedItems = items.map((item, index) => {
      // 최신순이면 큰 번호부터, 오래된순이면 작은 번호부터
      const no = sort === 'latest' 
        ? total - ((page - 1) * limit + index)
        : (page - 1) * limit + index + 1;

      return {
        no,
        id: item.id,
        name: item.name,
        phoneNumber: item.phoneNumber,
        email: item.email,
        trainingSeminarName: item.trainingSeminar?.name,
        participationDate: item.participationDate,
        participationDateFormatted: this.formatDate(item.participationDate),
        participationTime: item.participationTime, // HH:mm 형식
        attendeeCount: item.attendeeCount,
        status: item.status,
        statusLabel: this.getApplicationStatusLabel(item.status),
        appliedAt: item.appliedAt,
        appliedAtFormatted: this.formatDateTime(item.appliedAt),
      };
    });

    return { items: formattedItems, total, page, limit };
  }

  // 전체 신청 목록 조회 (관리자용)
  async findAllApplications(options: ApplicationListOptions = {}) {
    const { search, status, sort = 'latest', page = 1, limit = 20 } = options;

    const qb = this.appRepo.createQueryBuilder('app')
      .leftJoinAndSelect('app.trainingSeminar', 'seminar');

    // 이름 검색
    if (search) {
      qb.andWhere('app.name LIKE :search', { search: `%${search}%` });
    }

    // 상태 필터
    if (status) {
      qb.andWhere('app.status = :status', { status });
    }

    // 정렬
    qb.orderBy('app.appliedAt', sort === 'latest' ? 'DESC' : 'ASC');

    // 페이지네이션
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    // 응답 포맷: No, 이름, 휴대폰번호, 이메일, 교육/세미나명, 참여일자, 참여시간, 참석인원, 신청상태, 신청일시
    // 번호는 최신 등록일 기준으로 순차 번호 부여 (등록일 DESC 기준)
    const formattedItems = items.map((item, index) => {
      // 최신순이면 큰 번호부터, 오래된순이면 작은 번호부터
      const no = sort === 'latest' 
        ? total - ((page - 1) * limit + index)
        : (page - 1) * limit + index + 1;

      return {
        no,
        id: item.id,
        name: item.name,
        phoneNumber: item.phoneNumber,
        email: item.email,
        trainingSeminarId: item.trainingSeminarId,
        trainingSeminarName: item.trainingSeminar?.name,
        participationDate: item.participationDate,
        participationDateFormatted: this.formatDate(item.participationDate),
        participationTime: item.participationTime, // HH:mm 형식
        attendeeCount: item.attendeeCount,
        status: item.status,
        statusLabel: this.getApplicationStatusLabel(item.status),
        appliedAt: item.appliedAt,
        appliedAtFormatted: this.formatDateTime(item.appliedAt),
      };
    });

    return { items: formattedItems, total, page, limit };
  }

  async getApplicationById(id: number) {
    const app = await this.appRepo.findOne({ 
      where: { id },
      relations: ['trainingSeminar'],
    });
    if (!app) throw new NotFoundException('신청을 찾을 수 없습니다.');
    
    return {
      ...app,
      trainingSeminarName: app.trainingSeminar?.name,
      participationDateFormatted: this.formatDate(app.participationDate),
      statusLabel: this.getApplicationStatusLabel(app.status),
      appliedAtFormatted: this.formatDateTime(app.appliedAt),
    };
  }

  async updateApplicationStatus(id: number, status: ApplicationStatus) {
    const app = await this.appRepo.findOne({ where: { id } });
    if (!app) throw new NotFoundException('신청을 찾을 수 없습니다.');
    app.status = status;
    await this.appRepo.save(app);
    return { success: true, status, statusLabel: this.getApplicationStatusLabel(status) };
  }

  async deleteApplication(id: number) {
    const app = await this.appRepo.findOne({ where: { id } });
    if (!app) throw new NotFoundException('신청을 찾을 수 없습니다.');
    await this.appRepo.remove(app);
    return { success: true };
  }

  async deleteApplications(ids: number[]) {
    const apps = await this.appRepo.find({ where: { id: In(ids) } });
    if (!apps.length) return { success: true, deleted: 0 };
    await this.appRepo.remove(apps);
    return { success: true, deleted: apps.length };
  }

  // === Label Helpers ===
  private getTypeLabel(type: TrainingSeminarType): string {
    switch (type) {
      case TrainingSeminarType.VOD: return 'VOD';
      case TrainingSeminarType.SEMINAR: return '세미나';
      case TrainingSeminarType.TRAINING: return '교육';
      case TrainingSeminarType.LECTURE: return '강의';
      default: return '기타';
    }
  }

  private getRecruitmentTypeLabel(type: RecruitmentType): string {
    switch (type) {
      case RecruitmentType.FIRST_COME: return '선착순';
      case RecruitmentType.SELECTION: return '선발';
      default: return '기타';
    }
  }

  private getTargetMemberTypeLabel(type: TargetMemberType): string {
    switch (type) {
      case TargetMemberType.ALL: return '전체';
      case TargetMemberType.GENERAL: return '일반회원';
      case TargetMemberType.INSURANCE: return '보험사';
      case TargetMemberType.OTHER: return '기타';
      default: return '전체';
    }
  }

  private getApplicationStatusLabel(status: ApplicationStatus): string {
    switch (status) {
      case ApplicationStatus.WAITING: return '대기';
      case ApplicationStatus.CONFIRMED: return '확정';
      case ApplicationStatus.CANCELLED: return '취소';
      default: return '대기';
    }
  }

  // === Date Helpers ===
  // 모집 종료일 포맷: YY.MM.DD
  private formatRecruitmentDate(date: Date): string {
    const d = new Date(date);
    const year = String(d.getFullYear()).slice(-2); // 마지막 2자리
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  }

  // 일반 날짜 포맷: yyyy.MM.dd
  private formatDate(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  }

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

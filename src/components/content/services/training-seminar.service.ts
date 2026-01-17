import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UploadService } from 'src/libs/upload/upload.service';
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
  isPublic?: boolean;
}

interface ApplicationListOptions {
  search?: string;
  status?: ApplicationStatus;
  sort?: 'latest' | 'oldest';
  page?: number;
  limit?: number;
  startDate?: Date | string;
  endDate?: Date | string;
  isPublic?: boolean;
}

@Injectable()
export class TrainingSeminarService {
  constructor(
    @InjectRepository(TrainingSeminar)
    private readonly seminarRepo: Repository<TrainingSeminar>,
    @InjectRepository(TrainingSeminarApplication)
    private readonly appRepo: Repository<TrainingSeminarApplication>,
    private readonly uploadService: UploadService,
  ) { }

  // === Seminar CRUD ===
  async create(data: Partial<TrainingSeminar>) {
    // 선착순일 경우 정원 필수 및 유효성 검사
    if (data.recruitmentType === RecruitmentType.FIRST_COME) {
      if (!data.quota || data.quota <= 0) {
        throw new BadRequestException('선착순 모집의 경우 정원을 입력해주세요. (정원은 1명 이상이어야 합니다.)');
      }
    }

    // 날짜 문자열을 Date 객체로 변환 (YYYY.MM.DD 또는 YYYY-MM-DD 형식 지원)
    const seminarData: any = { ...data };
    if (seminarData.recruitmentEndDate && typeof seminarData.recruitmentEndDate === 'string') {
      // YYYY.MM.DD 형식을 YYYY-MM-DD로 변환
      const normalizedDate = seminarData.recruitmentEndDate.replace(/\./g, '-');
      seminarData.recruitmentEndDate = new Date(normalizedDate);
      if (isNaN(seminarData.recruitmentEndDate.getTime())) {
        throw new BadRequestException('모집 종료일 형식이 올바르지 않습니다. (YYYY.MM.DD 또는 YYYY-MM-DD 형식)');
      }
    }

    // 교육 일자 배열 유효성 검사 및 정규화
    if (seminarData.educationDates && Array.isArray(seminarData.educationDates)) {
      if (seminarData.educationDates.length === 0) {
        throw new BadRequestException('최소 1개 이상의 교육 일자를 선택해주세요.');
      }
      // 각 날짜 형식 검증 (YYYY.MM.DD 또는 YYYY-MM-DD)
      seminarData.educationDates = seminarData.educationDates.map((date: string) => {
        if (typeof date !== 'string') {
          throw new BadRequestException('교육 일자는 문자열 배열이어야 합니다.');
        }
        // YYYY.MM.DD 형식을 YYYY-MM-DD로 정규화 (저장은 원본 형식 유지)
        const normalizedDate = date.replace(/\./g, '-');
        const dateObj = new Date(normalizedDate);
        if (isNaN(dateObj.getTime())) {
          throw new BadRequestException(`교육 일자 형식이 올바르지 않습니다: ${date} (YYYY.MM.DD 또는 YYYY-MM-DD 형식)`);
        }
        return date; // 원본 형식 유지
      });
    }

    // 교육 시간 슬롯 배열 유효성 검사
    if (seminarData.educationTimeSlots && Array.isArray(seminarData.educationTimeSlots)) {
      if (seminarData.educationTimeSlots.length === 0) {
        throw new BadRequestException('최소 1개 이상의 교육 시간 슬롯을 선택해주세요.');
      }
      // 각 시간 슬롯 형식 검증 (HH:mm-HH:mm)
      seminarData.educationTimeSlots = seminarData.educationTimeSlots.map((slot: string) => {
        if (typeof slot !== 'string') {
          throw new BadRequestException('교육 시간 슬롯은 문자열 배열이어야 합니다.');
        }
        // HH:mm-HH:mm 형식 검증
        const timeSlotRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]-([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeSlotRegex.test(slot)) {
          throw new BadRequestException(`교육 시간 슬롯 형식이 올바르지 않습니다: ${slot} (HH:mm-HH:mm 형식, 예: 11:00-12:00)`);
        }
        return slot;
      });
    }

    const seminar = this.seminarRepo.create(seminarData);
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
      includeHidden = false,
      isPublic = false
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

      const base = {
        no,
        id: item.id,
        name: item.name,
        type: item.type,
        recruitmentType: item.recruitmentType,
        recruitmentEndDate: item.recruitmentEndDate,
        image: item.image,
        targetMemberType: item.targetMemberType,
        educationDates: item.educationDates || [],
        educationTimeSlots: item.educationTimeSlots || [],
        location: item.location,
        otherInfo: item.otherInfo,
        quota: item.quota,
        applicationCount: item.applications?.length || 0,
        isExposed: item.isExposed,
        isRecommended: item.isRecommended,
      };

      if (isPublic) {
        return {
          ...base,
          typeLabel: this.getTypeLabel(item.type),
          recruitmentTypeLabel: this.getRecruitmentTypeLabel(item.recruitmentType),
          targetMemberTypeLabel: this.getTargetMemberTypeLabel(item.targetMemberType),
          exposedLabel: item.isExposed ? 'Y' : 'N',
        };
      }

      return {
        ...base,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
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

  async findById(id: number, isPublic = false) {
    const seminar = await this.seminarRepo.findOne({
      where: { id },
      relations: ['applications'],
    });
    if (!seminar) throw new NotFoundException('교육/세미나를 찾을 수 없습니다.');

    const base = {
      ...seminar,
      applicationCount: seminar.applications?.length || 0,
    };

    if (isPublic) {
      const { createdAt, updatedAt, ...rest } = base;
      return {
        ...rest,
        typeLabel: this.getTypeLabel(seminar.type),
        recruitmentTypeLabel: this.getRecruitmentTypeLabel(seminar.recruitmentType),
        targetMemberTypeLabel: this.getTargetMemberTypeLabel(seminar.targetMemberType),
        exposedLabel: seminar.isExposed ? 'Y' : 'N',
      };
    }

    return base;
  }

  async update(id: number, data: Partial<TrainingSeminar>) {
    const seminar = await this.seminarRepo.findOne({ where: { id } });
    if (!seminar) throw new NotFoundException('교육/세미나를 찾을 수 없습니다.');

    // 선착순으로 변경하거나 이미 선착순인 경우 정원 검증
    const recruitmentType = data.recruitmentType ?? seminar.recruitmentType;
    if (recruitmentType === RecruitmentType.FIRST_COME) {
      const quota = data.quota ?? seminar.quota;
      if (!quota || quota <= 0) {
        throw new BadRequestException('선착순 모집의 경우 정원을 입력해주세요. (정원은 1명 이상이어야 합니다.)');
      }
    }

    // Handle image cleanup when image is being replaced or removed
    if (data.image !== undefined) {
      if (data.image === null && seminar.image) {
        // Image is being removed
        await this.uploadService.deleteFileByUrl(seminar.image.url);
      } else if (data.image && seminar.image && data.image.url !== seminar.image.url) {
        // Image is being replaced
        await this.uploadService.deleteFileByUrl(seminar.image.url);
      }
    }

    // 날짜 문자열을 Date 객체로 변환 (YYYY.MM.DD 또는 YYYY-MM-DD 형식 지원)
    const updateData: any = { ...data };
    if (updateData.recruitmentEndDate && typeof updateData.recruitmentEndDate === 'string') {
      const normalizedDate = updateData.recruitmentEndDate.replace(/\./g, '-');
      updateData.recruitmentEndDate = new Date(normalizedDate);
      if (isNaN(updateData.recruitmentEndDate.getTime())) {
        throw new BadRequestException('모집 종료일 형식이 올바르지 않습니다. (YYYY.MM.DD 또는 YYYY-MM-DD 형식)');
      }
    }
    if (updateData.startDate && typeof updateData.startDate === 'string') {
      const normalizedDate = updateData.startDate.replace(/\./g, '-');
      updateData.startDate = new Date(normalizedDate);
      if (isNaN(updateData.startDate.getTime())) {
        throw new BadRequestException('교육 시작일 형식이 올바르지 않습니다. (YYYY-MM-DD 또는 YYYY.MM.DD 형식)');
      }
    }
    if (updateData.endDate && typeof updateData.endDate === 'string') {
      const normalizedDate = updateData.endDate.replace(/\./g, '-');
      updateData.endDate = new Date(normalizedDate);
      if (isNaN(updateData.endDate.getTime())) {
        throw new BadRequestException('교육 종료일 형식이 올바르지 않습니다. (YYYY-MM-DD 또는 YYYY.MM.DD 형식)');
      }
    }

    // 교육 일자 배열 유효성 검사 및 정규화
    if (updateData.educationDates !== undefined) {
      if (Array.isArray(updateData.educationDates)) {
        if (updateData.educationDates.length === 0) {
          throw new BadRequestException('최소 1개 이상의 교육 일자를 선택해주세요.');
        }
        updateData.educationDates = updateData.educationDates.map((date: string) => {
          if (typeof date !== 'string') {
            throw new BadRequestException('교육 일자는 문자열 배열이어야 합니다.');
          }
          const normalizedDate = date.replace(/\./g, '-');
          const dateObj = new Date(normalizedDate);
          if (isNaN(dateObj.getTime())) {
            throw new BadRequestException(`교육 일자 형식이 올바르지 않습니다: ${date} (YYYY.MM.DD 또는 YYYY-MM-DD 형식)`);
          }
          return date;
        });
      } else if (updateData.educationDates !== null) {
        throw new BadRequestException('교육 일자는 배열 형식이어야 합니다.');
      }
    }

    // 교육 시간 슬롯 배열 유효성 검사
    if (updateData.educationTimeSlots !== undefined) {
      if (Array.isArray(updateData.educationTimeSlots)) {
        if (updateData.educationTimeSlots.length === 0) {
          throw new BadRequestException('최소 1개 이상의 교육 시간 슬롯을 선택해주세요.');
        }
        updateData.educationTimeSlots = updateData.educationTimeSlots.map((slot: string) => {
          if (typeof slot !== 'string') {
            throw new BadRequestException('교육 시간 슬롯은 문자열 배열이어야 합니다.');
          }
          const timeSlotRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]-([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
          if (!timeSlotRegex.test(slot)) {
            throw new BadRequestException(`교육 시간 슬롯 형식이 올바르지 않습니다: ${slot} (HH:mm-HH:mm 형식, 예: 11:00-12:00)`);
          }
          return slot;
        });
      } else if (updateData.educationTimeSlots !== null) {
        throw new BadRequestException('교육 시간 슬롯은 배열 형식이어야 합니다.');
      }
    }

    Object.assign(seminar, updateData);
    return this.seminarRepo.save(seminar);
  }

  async delete(id: number) {
    const seminar = await this.seminarRepo.findOne({ where: { id } });
    if (!seminar) throw new NotFoundException('교육/세미나를 찾을 수 없습니다.');

    // Cleanup S3 file before deleting entity
    if (seminar.image) {
      await this.uploadService.deleteFileByUrl(seminar.image.url);
    }

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

    // Check if recruitment deadline has passed (use server time)
    const now = new Date();
    const recruitmentEndDate = new Date(seminar.recruitmentEndDate);
    
    // Normalize dates to compare only date part (set time to 00:00:00)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const deadline = new Date(recruitmentEndDate.getFullYear(), recruitmentEndDate.getMonth(), recruitmentEndDate.getDate());
    
    if (today > deadline) {
      throw new BadRequestException('모집 기간이 종료되었습니다.');
    }

    // 날짜 및 시간 유효성 검사
    if (!data.participationDate) {
      throw new BadRequestException('참여 일자를 선택해주세요.');
    }
    if (!data.participationTime) {
      throw new BadRequestException('참여 시간을 선택해주세요.');
    }

    // 교육 일자 검증: 사용자가 선택한 날짜가 교육 일자 목록에 있는지 확인
    if (seminar.educationDates && seminar.educationDates.length > 0) {
      // participationDate를 YYYY-MM-DD 형식으로 정규화 (문자열 비교만 사용)
      const participationDateValue: string | Date = data.participationDate;
      const normalizedParticipationDate = typeof participationDateValue === 'string'
        ? participationDateValue.replace(/\./g, '-')
        : participationDateValue.toISOString().split('T')[0];

      // educationDates 배열을 YYYY-MM-DD 형식으로 정규화
      const normalizedEducationDates = seminar.educationDates.map(date =>
        date.replace(/\./g, '-')
      );

      // 문자열 비교로 일치하는 날짜 찾기
      const dateMatches = normalizedEducationDates.includes(normalizedParticipationDate);

      if (!dateMatches) {
        throw new BadRequestException(
          `선택하신 날짜(${normalizedParticipationDate})는 이 교육/세미나의 교육 일자와 일치하지 않습니다. 가능한 교육 일자: ${normalizedEducationDates.join(', ')}`
        );
      }
    }

    // 교육 시간 슬롯 검증: 사용자가 선택한 시간이 교육 시간 슬롯 목록에 있는지 확인
    if (seminar.educationTimeSlots && seminar.educationTimeSlots.length > 0) {
      // participationTime 형식 정규화 (HH:mm~HH:mm 또는 HH:mm-HH:mm -> HH:mm-HH:mm)
      const normalizedTime = data.participationTime.replace(/~/g, '-');

      // educationTimeSlots 배열에서 일치하는 시간 찾기
      const timeMatches = seminar.educationTimeSlots.some(timeSlot => {
        // educationTimeSlots는 "HH:mm-HH:mm" 형식
        return timeSlot === normalizedTime;
      });

      if (!timeMatches) {
        throw new BadRequestException(
          `선택하신 시간(${data.participationTime})은 이 교육/세미나의 교육 시간과 일치하지 않습니다. 가능한 교육 시간: ${seminar.educationTimeSlots.join(', ')}`
        );
      }
    }

    // 선착순일 경우 정원 체크 (날짜+시간별로 별도 관리)
    if (seminar.recruitmentType === RecruitmentType.FIRST_COME && seminar.quota) {
      // 사용자가 선택한 날짜를 YYYY-MM-DD 형식으로 정규화
      const participationDateValue: string | Date = data.participationDate;
      const normalizedParticipationDate = typeof participationDateValue === 'string'
        ? participationDateValue.replace(/\./g, '-')
        : participationDateValue.toISOString().split('T')[0];
      const normalizedTime = data.participationTime.replace(/~/g, '-');

      // 같은 날짜와 시간에 확정된 신청만 필터링
      const confirmedApplicationsForSameSlot = (seminar.applications || []).filter(app => {
        if (app.status !== ApplicationStatus.CONFIRMED) return false;

        // 날짜 비교 (문자열 비교만 사용)
        const appDateValue: string | Date = app.participationDate;
        const appNormalizedDate = typeof appDateValue === 'string'
          ? appDateValue.replace(/\./g, '-')
          : appDateValue.toISOString().split('T')[0];

        // 시간 비교 (형식 정규화)
        const appNormalizedTime = app.participationTime ? app.participationTime.replace(/~/g, '-') : '';

        return appNormalizedDate === normalizedParticipationDate && appNormalizedTime === normalizedTime;
      });

      // 해당 시간 슬롯의 현재 참석 인원 수 계산
      const currentAttendeeCountForSlot = confirmedApplicationsForSameSlot.reduce(
        (sum, app) => sum + (app.attendeeCount || 1),
        0
      );

      // 신청하려는 참석 인원 수
      const requestedAttendeeCount = data.attendeeCount || 1;

      // 해당 시간 슬롯의 정원 초과 체크
      if (currentAttendeeCountForSlot + requestedAttendeeCount > seminar.quota) {
        throw new BadRequestException(
          `선택하신 시간(${data.participationTime})의 모집 정원이 마감되었습니다. (정원: ${seminar.quota}명, 현재 신청: ${currentAttendeeCountForSlot}명, 요청: ${requestedAttendeeCount}명)`
        );
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
    const { search, status, sort = 'latest', page = 1, limit = 20, isPublic = false } = options;

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

      const base = {
        no,
        id: item.id,
        name: item.name,
        phoneNumber: item.phoneNumber,
        email: item.email,
        trainingSeminarName: item.trainingSeminar?.name,
        recruitmentType: item.trainingSeminar?.recruitmentType,
        participationDate: item.participationDate,
        participationTime: item.participationTime, // HH:mm 형식
        attendeeCount: item.attendeeCount,
        status: item.status,
        appliedAt: item.appliedAt,
      };

      if (isPublic) {
        return {
          ...base,
          statusLabel: this.getApplicationStatusLabel(item.status),
        };
      }

      return base;
    });

    return { items: formattedItems, total, page, limit };
  }

  // 사용자별 신청 목록 조회 (이메일 기준)
  async findUserApplications(email: string, options: ApplicationListOptions = {}) {
    const { search, status, sort = 'latest', page = 1, limit = 20, startDate, endDate, isPublic = true } = options;

    const qb = this.appRepo.createQueryBuilder('app')
      .leftJoinAndSelect('app.trainingSeminar', 'seminar')
      .where('app.email = :email', { email });

    // 이름 또는 세미나명 검색
    if (search) {
      qb.andWhere(
        '(app.name LIKE :search OR seminar.name LIKE :search)',
        { search: `%${search}%` }
      );
    }

    // 상태 필터
    if (status) {
      qb.andWhere('app.status = :status', { status });
    }

    // 날짜 범위 필터 (신청일 기준)
    if (startDate) {
      const start = startDate instanceof Date ? startDate : new Date(startDate);
      qb.andWhere('app.appliedAt >= :startDate', { startDate: start });
    }
    if (endDate) {
      const end = endDate instanceof Date ? endDate : new Date(endDate);
      // endDate의 끝 시간까지 포함 (23:59:59)
      end.setHours(23, 59, 59, 999);
      qb.andWhere('app.appliedAt <= :endDate', { endDate: end });
    }

    // 정렬
    qb.orderBy('app.appliedAt', sort === 'latest' ? 'DESC' : 'ASC');

    // 페이지네이션
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    // 응답 포맷 (UI에 맞게)
    const formattedItems = items.map((item, index) => {
      const no = sort === 'latest'
        ? total - ((page - 1) * limit + index)
        : (page - 1) * limit + index + 1;

      const seminar = item.trainingSeminar;
      const recruitmentEndDate = seminar?.recruitmentEndDate
        ? new Date(seminar.recruitmentEndDate)
        : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 신청 마감일까지 남은 일수 계산
      let deadlineDays: number | null = null;
      let deadlineLabel: string | null = null;
      if (recruitmentEndDate) {
        const diffTime = recruitmentEndDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 0) {
          deadlineDays = diffDays;
          deadlineLabel = `신청마감 D-${diffDays}`;
        } else if (diffDays === 0) {
          deadlineLabel = '신청마감 D-day';
        } else {
          deadlineLabel = '신청마감';
        }
      }

      // 상태에 따른 라벨
      const statusLabel = item.status === ApplicationStatus.CONFIRMED
        ? '신청완료'
        : item.status === ApplicationStatus.WAITING
          ? '대기중'
          : '취소';

      const base = {
        no,
        id: item.id,
        applicationId: item.id,
        seminarId: item.trainingSeminarId,
        name: seminar?.name || '-',
        type: seminar?.type || '',
        image: seminar?.image || null,
        location: seminar?.location || '-',
        status: item.status,
        participationDate: item.participationDate,
        participationTime: item.participationTime,
        attendeeCount: item.attendeeCount,
        appliedAt: item.appliedAt,
      };

      if (isPublic) {
        return {
          ...base,
          typeLabel: this.getTypeLabel(seminar?.type || TrainingSeminarType.SEMINAR),
          deadlineLabel,
          deadlineDays,
          statusLabel,
        };
      }

      return base;
    });

    return { items: formattedItems, total, page, limit };
  }

  // 전체 신청 목록 조회 (관리자용)
  async findAllApplications(options: ApplicationListOptions = {}) {
    const { search, status, sort = 'latest', page = 1, limit = 20, isPublic = false } = options;

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

      const base = {
        no,
        id: item.id,
        name: item.name,
        phoneNumber: item.phoneNumber,
        email: item.email,
        trainingSeminarId: item.trainingSeminarId,
        trainingSeminarName: item.trainingSeminar?.name,
        recruitmentType: item.trainingSeminar?.recruitmentType,
        participationDate: item.participationDate,
        participationTime: item.participationTime, // HH:mm 형식
        attendeeCount: item.attendeeCount,
        status: item.status,
        appliedAt: item.appliedAt,
      };

      if (isPublic) {
        return {
          ...base,
          statusLabel: this.getApplicationStatusLabel(item.status),
        };
      }

      return base;
    });

    return { items: formattedItems, total, page, limit };
  }

  async getApplicationById(id: number, isPublic = false) {
    const app = await this.appRepo.findOne({
      where: { id },
      relations: ['trainingSeminar'],
    });
    if (!app) throw new NotFoundException('신청을 찾을 수 없습니다.');

    const base = {
      ...app,
      trainingSeminarName: app.trainingSeminar?.name,
      recruitmentType: app.trainingSeminar?.recruitmentType,
    };

    if (isPublic) {
      return {
        ...base,
        statusLabel: this.getApplicationStatusLabel(app.status),
      };
    }

    return base;
  }

  async updateApplicationStatus(id: number, status: ApplicationStatus) {
    const app = await this.appRepo.findOne({ where: { id } });
    if (!app) throw new NotFoundException('신청을 찾을 수 없습니다.');
    app.status = status;
    await this.appRepo.save(app);
    return { success: true, status };
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

  // 날짜 비교용 포맷: yyyy.MM.dd (educationDates와 비교하기 위해)
  private formatDateForComparison(date: Date): string {
    return this.formatDate(date);
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

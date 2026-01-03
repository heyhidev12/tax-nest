import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Consultation } from 'src/libs/entity/consultation.entity';
import { CreateConsultationDto } from 'src/libs/dto/consultation/create-consultation.dto';
import { ConsultationStatus } from 'src/libs/enums/consultations.enum';
import { MemberFlag } from 'src/libs/enums/members.enum';

interface AdminListOptions {
  field?: string;
  memberFlag?: MemberFlag | string;
  status?: ConsultationStatus;
  search?: string;
  sort?: 'latest' | 'oldest';
  page?: number;
  limit?: number;
  startDate?: Date | string;
  endDate?: Date | string;
}

interface UserConsultationListOptions {
  search?: string;
  status?: ConsultationStatus;
  sort?: 'latest' | 'oldest';
  page?: number;
  limit?: number;
  startDate?: Date | string;
  endDate?: Date | string;
}

@Injectable()
export class ConsultationsService {
  constructor(
    @InjectRepository(Consultation)
    private readonly consultationRepo: Repository<Consultation>,
  ) { }

  /**
   * 상담 신청 생성
   * - 인증 여부와 관계없이 생성 가능
   * - controller 에서 memberId / memberFlag 를 세팅해서 넘겨줌
   */
  async create(dto: CreateConsultationDto & { memberId?: number | null; memberFlag?: MemberFlag }) {
    // 개인정보 처리 방침 이용 동의 필수 검증
    if (!dto.privacyAgreed) {
      throw new BadRequestException('개인정보 처리 방침 이용에 동의해주세요.');
    }

    // 이용 동의 필수 검증
    if (!dto.termsAgreed) {
      throw new BadRequestException('이용 동의에 동의해주세요.');
    }

    const entity = this.consultationRepo.create({
      name: dto.name,
      phoneNumber: dto.phoneNumber,
      consultingField: dto.consultingField,
      assignedTaxAccountant: dto.assignedTaxAccountant,
      content: dto.content,
      privacyAgreed: true,
      termsAgreed: true,
      memberFlag: dto.memberFlag ?? MemberFlag.NON_MEMBER,
      memberId: dto.memberId ?? null,
      status: ConsultationStatus.PENDING,
    });

    const saved = await this.consultationRepo.save(entity);

    return { id: saved.id, createdAt: saved.createdAt };
  }

  // 간단한 상담 목록 (예: 공개 리스트용)
  async list(page = 1, limit = 10) {
    const [items, total] = await this.consultationRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const mapped = items.map((c) => ({
      id: c.id,
      name: c.name,
      consultingField: c.consultingField,
      content: c.content,
      answer: c.answer,
      status: c.status,
      createdAt: c.createdAt,
    }));

    return { items: mapped, total, page, limit };
  }

  async findById(id: number) {
    const c = await this.consultationRepo.findOne({ where: { id } });
    if (!c) {
      throw new NotFoundException('상담 요청을 찾을 수 없습니다.');
    }
    return c;
  }

  // 비밀번호 검증 후 전체 내용 리턴
  async getDetailWithPassword(id: number, password: string) {
    const c = await this.findById(id);
    const ok = await bcrypt.compare(password, c.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('비밀번호가 올바르지 않습니다.');
    }
    // passwordHash 제외하고 리턴
    const { passwordHash, ...rest } = c;
    return rest;
  }

  async deleteWithPassword(id: number, password: string) {
    const c = await this.findById(id);
    const ok = await bcrypt.compare(password, c.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('비밀번호가 올바르지 않습니다.');
    }
    await this.consultationRepo.remove(c);
    return { success: true };
  }

  ////// ADMIN
  async adminList(options: AdminListOptions) {
    const {
      field,
      memberFlag,
      status,
      search,
      sort = 'latest',
      page = 1,
      limit = 20,
    } = options;

    const qb = this.consultationRepo.createQueryBuilder('c');

    // 상담 분야 필터
    if (field) {
      qb.andWhere('c.consultingField = :field', { field });
    }

    // 회원/비회원 필터
    if (memberFlag) {
      qb.andWhere('c.memberFlag = :memberFlag', { memberFlag });
    }

    // 진행 상태 필터
    if (status) {
      qb.andWhere('c.status = :status', { status });
    }

    // 상담 내용 검색
    if (search) {
      qb.andWhere('c.content LIKE :search', { search: `%${search}%` });
    }

    // 정렬 (기본: 최신순 - 등록일 DESC)
    qb.orderBy('c.createdAt', sort === 'latest' ? 'DESC' : 'ASC');

    // 페이지네이션
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    // 응답 포맷: No, 이름, 상담분야, 담당 세무사, 휴대폰 번호, 상담 내용 전체, 답변, 회원유형, 신청일시
    // 번호는 정렬 순서에 따라 순차적으로 부여 (최신순: 큰 번호부터, 오래된순: 작은 번호부터)
    const formattedItems = items.map((c, index) => {
      const no = sort === 'latest'
        ? total - ((page - 1) * limit + index)
        : (page - 1) * limit + index + 1;

      return {
        no,
        id: c.id,
        name: c.name,
        consultingField: c.consultingField,
        assignedTaxAccountant: c.assignedTaxAccountant || '-',
        phoneNumber: c.phoneNumber,
        content: c.content,
        answer: c.answer,
        memberFlag: c.memberFlag,
        status: c.status,
        createdAt: c.createdAt,
      };
    });

    return {
      items: formattedItems,
      total,
      page,
      limit,
    };
  }

  async adminGetOne(id: number) {
    const c = await this.consultationRepo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('상담 요청을 찾을 수 없습니다.');

    // passwordHash 제외하고 상세 정보 반환
    const { passwordHash, ...rest } = c;
    const isMember = c.memberFlag === MemberFlag.MEMBER;

    return {
      ...rest,
      // 회원인 경우에만 답변 입력 가능 (비회원은 비활성화)
      canEditAnswer: isMember,
    };
  }

  async adminSetAnswer(
    id: number,
    answer: string,
    status: ConsultationStatus = ConsultationStatus.COMPLETED,
  ) {
    const entity = await this.consultationRepo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('상담 요청을 찾을 수 없습니다.');
    }

    entity.answer = answer;
    entity.status = status;
    const saved = await this.consultationRepo.save(entity);

    // passwordHash 제외하고 반환
    const { passwordHash, ...result } = saved;
    return {
      ...result,
    };
  }

  async adminDeleteMany(ids: number[]) {
    const list = await this.consultationRepo.find({ where: { id: In(ids) } });
    if (!list.length) return { success: true, deleted: 0 };
    await this.consultationRepo.remove(list);
    return { success: true, deleted: list.length };
  }

  // 사용자별 상담 신청 목록 조회 (회원 기준)
  // - 기본적으로 memberId 로 조회
  // - 과거 데이터 호환을 위해 email 도 함께 받아서 memberId 가 없는 기록은 email 로 조회
  async findUserConsultations(memberId: number, email: string, options: UserConsultationListOptions = {}) {
    const { search, status, sort = 'latest', page = 1, limit = 20, startDate, endDate } = options;

    const qb = this.consultationRepo
      .createQueryBuilder('c')
      .where('(c.memberId = :memberId OR (c.memberId IS NULL AND c.email = :email))', {
        memberId,
        email,
      });

    // 상담 내용 또는 상담 분야 검색
    if (search) {
      qb.andWhere(
        '(c.content LIKE :search OR c.consultingField LIKE :search OR c.name LIKE :search)',
        { search: `%${search}%` }
      );
    }

    // 상태 필터
    if (status) {
      qb.andWhere('c.status = :status', { status });
    }

    // 날짜 범위 필터 (신청일 기준)
    if (startDate) {
      const start = startDate instanceof Date ? startDate : new Date(startDate);
      qb.andWhere('c.createdAt >= :startDate', { startDate: start });
    }
    if (endDate) {
      const end = endDate instanceof Date ? endDate : new Date(endDate);
      // endDate의 끝 시간까지 포함 (23:59:59)
      end.setHours(23, 59, 59, 999);
      qb.andWhere('c.createdAt <= :endDate', { endDate: end });
    }

    // 정렬
    qb.orderBy('c.createdAt', sort === 'latest' ? 'DESC' : 'ASC');

    // 페이지네이션
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    // 응답 포맷 (UI에 맞게) - 전체 content/answer 제공, 별도의 미리보기 필드는 사용하지 않음
    const formattedItems = items.map((item, index) => {
      const no = sort === 'latest'
        ? total - ((page - 1) * limit + index)
        : (page - 1) * limit + index + 1;

      return {
        no,
        id: item.id,
        consultationId: item.id,
        name: item.name,
        consultingField: item.consultingField,
        content: item.content,
        answer: item.answer,
        assignedTaxAccountant: item.assignedTaxAccountant || '-',
        status: item.status,
        statusLabel: item.status === ConsultationStatus.PENDING ? '신청완료' : '상담완료',
        createdAt: item.createdAt,
        createdAtFormatted: this.formatDateTime(item.createdAt),
      };
    });

    return { items: formattedItems, total, page, limit };
  }

  // 등록된 상담 분야 목록 조회 (드롭다운용)
  async getConsultingFields(): Promise<string[]> {
    const result = await this.consultationRepo
      .createQueryBuilder('c')
      .select('DISTINCT c.consultingField', 'consultingField')
      .getRawMany();
    return result.map((r) => r.consultingField);
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

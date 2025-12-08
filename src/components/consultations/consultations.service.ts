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
}

@Injectable()
export class ConsultationsService {
  constructor(
    @InjectRepository(Consultation)
    private readonly consultationRepo: Repository<Consultation>,
  ) {}

  async create(dto: CreateConsultationDto) {
    // 개인정보 동의 필수 검증
    if (!dto.privacyAgreed) {
      throw new BadRequestException('개인정보 수집/이용에 동의해주세요.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const entity = this.consultationRepo.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      phoneNumber: dto.phoneNumber,
      consultingField: dto.consultingField,
      insuranceCompanyName: dto.insuranceCompanyName,
      residenceArea: dto.residenceArea,
      content: dto.content,
      privacyAgreed: true,
      memberFlag: dto.memberFlag ?? MemberFlag.NON_MEMBER,
      status: ConsultationStatus.PENDING,
    });

    const saved = await this.consultationRepo.save(entity);

    // 리스트/상세에서 password는 절대 보내지 않음
    return { id: saved.id, createdAt: saved.createdAt };
  }

  // 리스트 (내용은 일부만, 마스킹도 프론트에서 가능)
  async list(page = 1, limit = 10) {
    const [items, total] = await this.consultationRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // 내용 일부만 보내거나, 프론트에서 마스킹 처리
    const mapped = items.map((c) => ({
      id: c.id,
      name: c.name,
      consultingField: c.consultingField,
      contentPreview: c.content.slice(0, 30), // 30자 미리보기
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

    // 응답 포맷: No, 이름, 상담분야, 보험사, 전화번호, 상담내용(한 줄), 회원유형, 등록일시
    const formattedItems = items.map((c, index) => ({
      no: total - ((page - 1) * limit + index), // 역순 번호
      id: c.id,
      name: c.name,
      consultingField: c.consultingField,
      insuranceCompanyName: c.insuranceCompanyName || '-',
      phoneNumber: c.phoneNumber,
      contentPreview: c.content.length > 50 ? c.content.slice(0, 50) + '...' : c.content,
      memberFlag: c.memberFlag,
      memberFlagLabel: c.memberFlag === MemberFlag.MEMBER ? '회원' : '비회원',
      status: c.status,
      statusLabel: c.status === ConsultationStatus.PENDING ? '신청완료' : '상담완료',
      createdAt: c.createdAt,
      // Date format: yyyy.MM.dd HH:mm:ss
      createdAtFormatted: this.formatDateTime(c.createdAt),
    }));

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
    return {
      ...rest,
      memberFlagLabel: c.memberFlag === MemberFlag.MEMBER ? '회원' : '비회원',
      statusLabel: c.status === ConsultationStatus.PENDING ? '신청완료' : '상담완료',
      createdAtFormatted: this.formatDateTime(c.createdAt),
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
    return this.consultationRepo.save(entity);
  }

  async adminDeleteMany(ids: number[]) {
    const list = await this.consultationRepo.find({ where: { id: In(ids) } });
    if (!list.length) return { success: true, deleted: 0 };
    await this.consultationRepo.remove(list);
    return { success: true, deleted: list.length };
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

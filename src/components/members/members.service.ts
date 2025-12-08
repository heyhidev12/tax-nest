import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Member } from 'src/libs/entity/member.entity';
import { Consultation } from 'src/libs/entity/consultation.entity';
import { In, Repository } from 'typeorm';
import { MemberStatus, MemberType } from 'src/libs/enums/members.enum';
import * as bcrypt from 'bcrypt';

interface MemberListOptions {
  search?: string;
  memberType?: MemberType;
  status?: MemberStatus;
  isApproved?: boolean;
  sort?: 'latest' | 'oldest';
  page?: number;
  limit?: number;
}

interface CreateMemberData {
  loginId: string;
  password: string;
  name: string;
  email: string;
  phoneNumber: string;
  memberType: MemberType;
  newsletterSubscribed?: boolean;
  affiliation?: string;
}

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private readonly memberRepo: Repository<Member>,
    @InjectRepository(Consultation)
    private readonly consultationRepo: Repository<Consultation>,
  ) {}

  findByLoginId(loginId: string) {
    return this.memberRepo.findOne({ where: { loginId } });
  }

  create(data: Partial<Member>) {
    const member = this.memberRepo.create(data);
    return this.memberRepo.save(member);
  }

  async findById(id: number) {
    const member = await this.memberRepo.findOne({ where: { id } });
    if (!member) {
      throw new NotFoundException('회원이 존재하지 않습니다.');
    }
    return member;
  }

  async updateProfile(id: number, data: Partial<Member>) {
    const member = await this.findById(id);
    Object.assign(member, data);
    return this.memberRepo.save(member);
  }

  // ======== Admin Methods ========

  // 회원 목록 (검색, 필터 지원)
  async adminList(options: MemberListOptions) {
    const {
      search,
      memberType,
      status,
      isApproved,
      sort = 'latest',
      page = 1,
      limit = 20,
    } = options;

    const qb = this.memberRepo.createQueryBuilder('member');

    // 회원 유형 필터
    if (memberType) {
      qb.andWhere('member.memberType = :memberType', { memberType });
    }

    // 회원 상태 필터 (이용중/탈퇴)
    if (status) {
      qb.andWhere('member.status = :status', { status });
    }

    // 승인 여부 필터
    if (isApproved !== undefined) {
      qb.andWhere('member.isApproved = :isApproved', { isApproved });
    }

    // 검색: 이름 또는 전화번호
    if (search) {
      qb.andWhere('(member.name LIKE :search OR member.phoneNumber LIKE :search)', {
        search: `%${search}%`,
      });
    }

    // 정렬 (기본: 최신순 - 등록일 DESC)
    qb.orderBy('member.createdAt', sort === 'latest' ? 'DESC' : 'ASC');

    // 페이지네이션
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    // 응답 포맷: No, 회원유형, ID, 이름, 이메일, 전화번호, 뉴스레터, 등록일, 상태
    const formattedItems = items.map((m, index) => ({
      no: total - ((page - 1) * limit + index), // 역순 번호
      id: m.id,
      memberType: m.memberType,
      memberTypeLabel: this.getMemberTypeLabel(m.memberType),
      loginId: m.loginId,
      name: m.name,
      email: m.email,
      phoneNumber: m.phoneNumber,
      newsletterSubscribed: m.newsletterSubscribed,
      newsletterLabel: m.newsletterSubscribed ? 'Y' : 'N',
      isApproved: m.isApproved,
      approvalLabel: m.isApproved ? '승인' : '미승인',
      status: m.status,
      statusLabel: m.status === MemberStatus.ACTIVE ? '이용중' : '탈퇴',
      affiliation: m.affiliation,
      createdAt: m.createdAt,
      createdAtFormatted: this.formatDateTime(m.createdAt),
    }));

    return {
      items: formattedItems,
      total,
      page,
      limit,
    };
  }

  // 보험사 회원 승인 대기 목록
  async adminPendingApprovalList(page = 1, limit = 20, sort: 'latest' | 'oldest' = 'latest') {
    const [items, total] = await this.memberRepo.findAndCount({
      where: {
        memberType: MemberType.INSURANCE,
        isApproved: false,
      },
      order: { createdAt: sort === 'latest' ? 'DESC' : 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // 응답 포맷
    const formattedItems = items.map((m, index) => ({
      no: total - ((page - 1) * limit + index),
      id: m.id,
      loginId: m.loginId,
      name: m.name,
      email: m.email,
      phoneNumber: m.phoneNumber,
      affiliation: m.affiliation,
      isApproved: m.isApproved,
      approvalLabel: m.isApproved ? '승인' : '미승인',
      createdAt: m.createdAt,
      createdAtFormatted: this.formatDateTime(m.createdAt),
    }));

    return { items: formattedItems, total, page, limit };
  }

  // 회원 승인
  async adminApprove(id: number) {
    const member = await this.findById(id);
    member.isApproved = true;
    await this.memberRepo.save(member);
    return { success: true, message: '회원이 승인되었습니다.' };
  }

  // 회원 승인 취소
  async adminRejectApproval(id: number) {
    const member = await this.findById(id);
    member.isApproved = false;
    await this.memberRepo.save(member);
    return { success: true, message: '회원 승인이 취소되었습니다.' };
  }

  // 회원 상세 조회 (상담 신청 수 포함)
  async adminGetOne(id: number) {
    const member = await this.memberRepo.findOne({ where: { id } });
    if (!member) {
      throw new NotFoundException('회원을 찾을 수 없습니다.');
    }

    // 상담 신청 수 조회
    const consultationCount = await this.consultationRepo.count({
      where: { email: member.email },
    });

    // passwordHash 제외
    const { passwordHash, ...rest } = member;

    return {
      ...rest,
      memberTypeLabel: this.getMemberTypeLabel(member.memberType),
      statusLabel: member.status === MemberStatus.ACTIVE ? '이용중' : '탈퇴',
      approvalLabel: member.isApproved ? '승인' : '미승인',
      newsletterLabel: member.newsletterSubscribed ? 'Y' : 'N',
      consultationCount,
      createdAtFormatted: this.formatDateTime(member.createdAt),
      updatedAtFormatted: this.formatDateTime(member.updatedAt),
    };
  }

  // 관리자 회원 생성
  async adminCreate(data: CreateMemberData) {
    // 중복 ID 체크
    const existing = await this.findByLoginId(data.loginId);
    if (existing) {
      throw new BadRequestException('이미 사용 중인 ID입니다.');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    // 보험사 회원은 기본 미승인, 나머지는 자동 승인
    const isApproved = data.memberType !== MemberType.INSURANCE;

    const member = this.memberRepo.create({
      loginId: data.loginId,
      passwordHash,
      name: data.name,
      email: data.email,
      phoneNumber: data.phoneNumber,
      memberType: data.memberType,
      isApproved,
      newsletterSubscribed: data.newsletterSubscribed ?? false,
      affiliation: data.affiliation,
    });

    const saved = await this.memberRepo.save(member);

    return {
      id: saved.id,
      loginId: saved.loginId,
      name: saved.name,
      memberType: saved.memberType,
      isApproved: saved.isApproved,
    };
  }

  // 회원 삭제 (다중)
  async adminDeleteMany(ids: number[]) {
    const list = await this.memberRepo.find({ where: { id: In(ids) } });
    if (!list.length) return { success: true, deleted: 0 };
    await this.memberRepo.remove(list);
    return { success: true, deleted: list.length, message: '삭제가 완료되었습니다.' };
  }

  // 회원 상태 변경 (탈퇴 처리 등)
  async adminUpdateStatus(id: number, status: MemberStatus) {
    const member = await this.findById(id);
    member.status = status;
    await this.memberRepo.save(member);
    return { 
      success: true, 
      message: status === MemberStatus.WITHDRAWN ? '회원 탈퇴 처리되었습니다.' : '회원 상태가 변경되었습니다.',
    };
  }

  // 회원 유형 라벨
  private getMemberTypeLabel(memberType: MemberType): string {
    switch (memberType) {
      case MemberType.GENERAL:
        return '일반회원';
      case MemberType.CORPORATE:
        return '법인대표/직원';
      case MemberType.INSURANCE:
        return '보험사 직원';
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

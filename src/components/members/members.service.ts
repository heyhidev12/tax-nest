import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Member } from 'src/libs/entity/member.entity';
import { In, Like, Repository } from 'typeorm';
import { MemberStatus, MemberType } from 'src/libs/enums/members.enum';

interface MemberListOptions {
  search?: string;
  memberType?: MemberType;
  status?: MemberStatus;
  isApproved?: boolean;
  page?: number;
  limit?: number;
}

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private readonly memberRepo: Repository<Member>,
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
      page = 1,
      limit = 20,
    } = options;

    const where: any = {};

    if (memberType) {
      where.memberType = memberType;
    }

    if (status) {
      where.status = status;
    }

    if (isApproved !== undefined) {
      where.isApproved = isApproved;
    }

    // 검색: 이름 또는 전화번호
    if (search) {
      const [items, total] = await this.memberRepo
        .createQueryBuilder('member')
        .where(where)
        .andWhere('(member.name LIKE :search OR member.phoneNumber LIKE :search)', {
          search: `%${search}%`,
        })
        .orderBy('member.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      return { items, total, page, limit };
    }

    const [items, total] = await this.memberRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      select: ['id', 'loginId', 'name', 'email', 'phoneNumber', 'memberType', 'isApproved', 'status', 'newsletterSubscribed', 'affiliation', 'createdAt'],
    });

    return { items, total, page, limit };
  }

  // 보험사 회원 승인 대기 목록
  async adminPendingApprovalList(page = 1, limit = 20) {
    const [items, total] = await this.memberRepo.findAndCount({
      where: {
        memberType: MemberType.INSURANCE,
        isApproved: false,
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total, page, limit };
  }

  // 회원 승인
  async adminApprove(id: number) {
    const member = await this.findById(id);
    member.isApproved = true;
    await this.memberRepo.save(member);
    return { success: true };
  }

  // 회원 상세 조회
  async adminGetOne(id: number) {
    const member = await this.memberRepo.findOne({ where: { id } });
    if (!member) {
      throw new NotFoundException('회원을 찾을 수 없습니다.');
    }
    // passwordHash 제외
    const { passwordHash, ...rest } = member;
    return rest;
  }

  // 회원 삭제 (다중)
  async adminDeleteMany(ids: number[]) {
    const list = await this.memberRepo.find({ where: { id: In(ids) } });
    if (!list.length) return { success: true, deleted: 0 };
    await this.memberRepo.remove(list);
    return { success: true, deleted: list.length };
  }

  // 회원 상태 변경 (탈퇴 처리 등)
  async adminUpdateStatus(id: number, status: MemberStatus) {
    const member = await this.findById(id);
    member.status = status;
    await this.memberRepo.save(member);
    return { success: true };
  }
}

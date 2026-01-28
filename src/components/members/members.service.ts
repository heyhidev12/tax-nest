import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Member } from 'src/libs/entity/member.entity';
import { Consultation } from 'src/libs/entity/consultation.entity';
import { NewsletterSubscriber } from 'src/libs/entity/newsletter-subscriber.entity';
import { In, Repository, DataSource } from 'typeorm';
import { MemberStatus, MemberType } from 'src/libs/enums/members.enum';
import * as bcrypt from 'bcrypt';
import { AdminUpdateMemberDto } from 'src/libs/dto/admin/admin-update-member.dto';

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
    @InjectRepository(NewsletterSubscriber)
    private readonly newsletterSubscriberRepo: Repository<NewsletterSubscriber>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) { }

  findByLoginId(loginId: string) {
    return this.memberRepo.findOne({ where: { loginId } });
  }

  findByEmail(email: string) {
    return this.memberRepo.findOne({ where: { email } });
  }

  findByPhoneNumber(phoneNumber: string) {
    return this.memberRepo.findOne({ where: { phoneNumber } });
  }

  // Methods for checking uniqueness during signup/registration (excludes WITHDRAWN users)
  findActiveByLoginId(loginId: string) {
    return this.memberRepo.findOne({ 
      where: { 
        loginId, 
        status: MemberStatus.ACTIVE 
      } 
    });
  }

  findActiveByEmail(email: string) {
    return this.memberRepo.findOne({ 
      where: { 
        email, 
        status: MemberStatus.ACTIVE 
      } 
    });
  }

  findActiveByPhoneNumber(phoneNumber: string) {
    return this.memberRepo.findOne({ 
      where: { 
        phoneNumber, 
        status: MemberStatus.ACTIVE 
      } 
    });
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

    const conditions: string[] = [];
    const params: Record<string, any> = {};

    if (memberType) {
      conditions.push('member.memberType = :memberType');
      params.memberType = memberType;
    }

    if (status) {
      conditions.push('member.status = :status');
      params.status = status;
    }

    if (isApproved !== undefined) {
      conditions.push('member.isApproved = :isApproved');
      params.isApproved = isApproved;
    }

    if (search) {
      conditions.push('(member.name LIKE :search OR member.phoneNumber LIKE :search)');
      params.search = `%${search}%`;
    }

    if (conditions.length > 0) {
      qb.where(conditions.join(' AND '), params);
    }

    qb.orderBy('member.createdAt', sort === 'latest' ? 'DESC' : 'ASC');

    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();

    const formattedItems = items.map((m) => ({
      id: m.id,
      memberType: m.memberType,
      loginId: m.loginId,
      name: m.name,
      email: m.email,
      phoneNumber: m.phoneNumber,
      newsletterSubscribed: m.newsletterSubscribed,
      isApproved: m.isApproved,
      status: m.status,
      affiliation: m.affiliation,
      createdAt: m.createdAt,
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

    // Use same formatting as adminList to ensure response shape consistency (without row number)
    const formattedItems = items.map((m) => ({
      id: m.id,
      memberType: m.memberType,
      loginId: m.loginId,
      name: m.name,
      email: m.email,
      phoneNumber: m.phoneNumber,
      newsletterSubscribed: m.newsletterSubscribed,
      isApproved: m.isApproved,
      status: m.status,
      affiliation: m.affiliation,
      createdAt: m.createdAt,
    }));

    return { items: formattedItems, total, page, limit };
  }

  async adminApprove(id: number) {
    const member = await this.findById(id);
    member.isApproved = true;
    await this.memberRepo.save(member);
    return { success: true, message: '회원이 승인되었습니다.' };
  }

  async adminRejectApproval(id: number) {
    const member = await this.findById(id);
    member.isApproved = false;
    await this.memberRepo.save(member);
    return { success: true, message: '회원 승인이 취소되었습니다.' };
  }

  async adminGetOne(id: number) {
    const member = await this.memberRepo.findOne({ where: { id } });
    if (!member) {
      throw new NotFoundException('회원을 찾을 수 없습니다.');
    }

    const consultationCount = await this.consultationRepo.count({
      where: {
        name: member.name,
        phoneNumber: member.phoneNumber,
      },
    });

    const { passwordHash, ...rest } = member;

    return {
      ...rest,
      consultationCount,
    };
  }

  async adminCreate(data: CreateMemberData) {
    // Check loginId uniqueness (only against ACTIVE users)
    const existingLoginId = await this.findActiveByLoginId(data.loginId);
    if (existingLoginId) {
      throw new BadRequestException('이미 사용 중인 아이디입니다.');
    }

    // Check email uniqueness (only against ACTIVE users)
    const existingEmail = await this.findActiveByEmail(data.email);
    if (existingEmail) {
      throw new BadRequestException('이미 등록된 이메일입니다.');
    }

    // Check phoneNumber uniqueness (only against ACTIVE users)
    const existingPhone = await this.findActiveByPhoneNumber(data.phoneNumber);
    if (existingPhone) {
      throw new BadRequestException('이미 등록된 휴대폰 번호입니다.');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

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

  async adminDeleteMany(ids: number[]) {
    const list = await this.memberRepo.find({ where: { id: In(ids) } });
    if (!list.length) return { success: true, deleted: 0 };
    await this.memberRepo.remove(list);
    return { success: true, deleted: list.length, message: '삭제가 완료되었습니다.' };
  }

  async adminUpdateStatus(id: number, status: MemberStatus) {
    const member = await this.findById(id);
    member.status = status;
    await this.memberRepo.save(member);
    return {
      success: true,
      message: status === MemberStatus.WITHDRAWN ? '회원 탈퇴 처리되었습니다.' : '회원 상태가 변경되었습니다.',
    };
  }

  async adminUpdate(id: number, dto: AdminUpdateMemberDto) {
    const member = await this.findById(id);

    // Validate email uniqueness if being updated (only against ACTIVE users)
    if (dto.email !== undefined && dto.email !== member.email) {
      const existingEmail = await this.findActiveByEmail(dto.email);
      if (existingEmail && existingEmail.id !== id) {
        throw new BadRequestException('이미 등록된 이메일입니다.');
      }
    }

    // Validate phoneNumber uniqueness if being updated (only against ACTIVE users)
    if (dto.phoneNumber !== undefined && dto.phoneNumber !== member.phoneNumber) {
      const existingPhone = await this.findActiveByPhoneNumber(dto.phoneNumber);
      if (existingPhone && existingPhone.id !== id) {
        throw new BadRequestException('이미 등록된 휴대폰 번호입니다.');
      }
    }

    if (dto.memberType !== undefined) {
      member.memberType = dto.memberType;
    }
    if (dto.name !== undefined) {
      member.name = dto.name;
    }
    if (dto.email !== undefined) {
      member.email = dto.email;
    }
    if (dto.phoneNumber !== undefined) {
      member.phoneNumber = dto.phoneNumber;
    }
    if (dto.affiliation !== undefined) {
      member.affiliation = dto.affiliation;
    }
    if (dto.newsletterSubscribed !== undefined) {
      member.newsletterSubscribed = dto.newsletterSubscribed;
    }
    if (dto.status !== undefined) {
      member.status = dto.status;
    }
    if (dto.isApproved !== undefined) {
      member.isApproved = dto.isApproved;
    }

    // Sync newsletter subscription status with newsletter table using transaction
    if (dto.newsletterSubscribed !== undefined) {
      await this.dataSource.transaction(async (transactionalEntityManager) => {
        // Step 1: Update member table
        await transactionalEntityManager.save(Member, member);

        // Step 2: Sync newsletter table
        const memberEmail = dto.email !== undefined ? dto.email : member.email;
        if (memberEmail) {
          let newsletterRecord = await transactionalEntityManager.findOne(NewsletterSubscriber, {
            where: { email: memberEmail },
          });

          if (dto.newsletterSubscribed === true) {
            // Create or update newsletter record
            if (newsletterRecord) {
              newsletterRecord.isSubscribed = true;
              newsletterRecord.subscribedAt = newsletterRecord.subscribedAt || new Date();
              newsletterRecord.unsubscribedAt = null;
              newsletterRecord.isMailSynced = true;
              await transactionalEntityManager.save(NewsletterSubscriber, newsletterRecord);
            } else {
              // Create new newsletter record
              const newSubscriber = transactionalEntityManager.create(NewsletterSubscriber, {
                email: memberEmail,
                name: member.name,
                isSubscribed: true,
                subscribedAt: new Date(),
                unsubscribedAt: null,
                isMailSynced: true,
              });
              await transactionalEntityManager.save(NewsletterSubscriber, newSubscriber);
            }
          } else {
            // Update newsletter record to unsubscribed (do NOT delete)
            if (newsletterRecord) {
              newsletterRecord.isSubscribed = false;
              newsletterRecord.unsubscribedAt = new Date();
              newsletterRecord.isMailSynced = true;
              await transactionalEntityManager.save(NewsletterSubscriber, newsletterRecord);
            }
          }
        }
      });
    } else {
      // No newsletter subscription change, just save member
      await this.memberRepo.save(member);
    }

    return this.adminGetOne(id);
  }

  private getMemberTypeLabel(memberType: MemberType): string {
    switch (memberType) {
      case MemberType.GENERAL:
        return '일반회원';
      case MemberType.OTHER:
        return '법인대표/직원';
      case MemberType.INSURANCE:
        return '보험사 직원';
      default:
        return '기타';
    }
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

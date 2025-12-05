import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Consultation } from 'src/libs/entity/consultation.entity';
import { CreateConsultationDto } from 'src/libs/dto/consultation/create-consultation.dto';
import { ConsultationStatus } from 'src/libs/enums/consultations.enum';
import { MemberFlag } from 'src/libs/enums/members.enum';


interface AdminListOptions {
  field?: string;
  memberFlag?: MemberFlag | string;
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
      privacyAgreed: !!dto.privacyAgreed,
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
      search,
      sort = 'latest',
      page = 1,
      limit = 20,
    } = options;

    const where: any = {};

    if (field) {
      where.consultingField = field;
    }

    if (memberFlag) {
      where.memberFlag = memberFlag;
    }

    if (search) {
      where.content = Like(`%${search}%`);
    }

    const order = sort === 'latest'
      ? { createdAt: 'DESC' }
      : { createdAt: 'ASC' };

    const [items, total] = await this.consultationRepo.findAndCount({
      where,
      order: {
        createdAt: sort === 'latest' ? 'DESC' as const : 'ASC' as const,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      total,
      page,
      limit,
    };
  }

  async adminGetOne(id: number) {
    const c = await this.consultationRepo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('상담 요청을 찾을 수 없습니다.');
    return c;
  }

  async adminSetAnswer(
    id: number,
    answer: string,
    status: ConsultationStatus = ConsultationStatus.COMPLETED,
  ) {
    const c = await this.adminGetOne(id);
    c.answer = answer;
    c.status = status;
    return this.consultationRepo.save(c);
  }

  async adminDeleteMany(ids: number[]) {
    const list = await this.consultationRepo.findByIds(ids);
    if (!list.length) return { success: true, deleted: 0 };
    await this.consultationRepo.remove(list);
    return { success: true, deleted: list.length };
  }
}

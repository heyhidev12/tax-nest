import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FooterPolicy, FooterPolicyType } from 'src/libs/entity/footer-policy.entity';

@Injectable()
export class FooterPolicyService {
  constructor(
    @InjectRepository(FooterPolicy)
    private readonly policyRepo: Repository<FooterPolicy>,
  ) {}

  // ===== ADMIN APIs =====

  async findAll() {
    const items = await this.policyRepo.find({
      order: { type: 'ASC' },
    });

    return { items };
  }

  async create(data: { type: FooterPolicyType; title: string; content: string; isActive?: boolean }) {
    // Check if policy with this type already exists
    const existing = await this.policyRepo.findOne({ where: { type: data.type } });
    if (existing) {
      throw new BadRequestException(`이미 ${data.type} 타입의 Footer Policy가 존재합니다.`);
    }

    const policy = this.policyRepo.create({
      type: data.type,
      title: data.title,
      content: data.content,
      isActive: data.isActive ?? true,
    });

    return this.policyRepo.save(policy);
  }

  async findById(id: number) {
    const policy = await this.policyRepo.findOne({ where: { id } });
    if (!policy) {
      throw new NotFoundException('Footer policy를 찾을 수 없습니다.');
    }
    return policy;
  }

  async update(id: number, data: Partial<FooterPolicy>) {
    const policy = await this.policyRepo.findOne({ where: { id } });
    if (!policy) {
      throw new NotFoundException('Footer policy를 찾을 수 없습니다.');
    }

    Object.assign(policy, data);
    return this.policyRepo.save(policy);
  }

  // ===== PUBLIC APIs =====

  async findAllPublic() {
    const items = await this.policyRepo.find({
      where: { isActive: true },
      order: { type: 'ASC' },
    });

    return items.map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      content: item.content,
    }));
  }

  async findByType(type: FooterPolicyType) {
    const policy = await this.policyRepo.findOne({
      where: { type, isActive: true },
    });

    if (!policy) {
      return null;
    }

    return {
      id: policy.id,
      type: policy.type,
      title: policy.title,
      content: policy.content,
    };
  }

  // ===== SEED / INIT =====

  async ensureDefaultPolicies() {
    const termsExists = await this.policyRepo.findOne({
      where: { type: FooterPolicyType.TERMS },
    });

    if (!termsExists) {
      await this.policyRepo.save({
        type: FooterPolicyType.TERMS,
        title: '이용약관',
        content: '<p>이용약관 내용을 입력해주세요.</p>',
        isActive: true,
      });
    }

    const privacyExists = await this.policyRepo.findOne({
      where: { type: FooterPolicyType.PRIVACY },
    });

    if (!privacyExists) {
      await this.policyRepo.save({
        type: FooterPolicyType.PRIVACY,
        title: '개인정보처리방침',
        content: '<p>개인정보처리방침 내용을 입력해주세요.</p>',
        isActive: true,
      });
    }
  }
}

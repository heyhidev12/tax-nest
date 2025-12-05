import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Member } from 'src/libs/entity/member.entity';
import { Repository } from 'typeorm';

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
}

import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MembersService } from '../members/members.service';
import { SignUpDto } from 'src/libs/dto/auth/sign-up.dto';
import { LoginDto } from 'src/libs/dto/auth/login.dto';
import { MemberType } from 'src/libs/enums/members.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly membersService: MembersService,
    private readonly jwtService: JwtService,
  ) {}

  async signUp(dto: SignUpDto) {
    const existing = await this.membersService.findByLoginId(dto.loginId);
    if (existing) {
      throw new BadRequestException('이미 사용 중인 ID 입니다.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 보험사 회원이면 isApproved=false 로 시작 (IA에 따라) :contentReference[oaicite:5]{index=5}
    const isApproved = dto.memberType !== MemberType.INSURANCE;

    const member = await this.membersService.create({
      loginId: dto.loginId,
      passwordHash,
      name: dto.name,
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      memberType: dto.memberType,
      isApproved,
    });

    return {
      id: member.id,
      loginId: member.loginId,
      name: member.name,
      memberType: member.memberType,
      isApproved: member.isApproved,
    };
  }

  async login(dto: LoginDto) {
    const member = await this.membersService.findByLoginId(dto.loginId);
    if (!member) {
      throw new UnauthorizedException('ID 또는 비밀번호가 올바르지 않습니다.');
    }

    const match = await bcrypt.compare(dto.password, member.passwordHash);
    if (!match) {
      throw new UnauthorizedException('ID 또는 비밀번호가 올바르지 않습니다.');
    }

    if (!member.isApproved) {
      throw new UnauthorizedException('관리자 승인 대기 중인 계정입니다.');
    }

    const payload = {
      sub: member.id,
      loginId: member.loginId,
      memberType: member.memberType,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      member: {
        id: member.id,
        loginId: member.loginId,
        name: member.name,
        memberType: member.memberType,
      },
    };
  }
}

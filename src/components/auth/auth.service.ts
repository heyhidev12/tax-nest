import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Member } from 'src/libs/entity/member.entity';
import { MembersService } from '../members/members.service';
import { SignUpDto } from 'src/libs/dto/auth/sign-up.dto';
import { LoginDto } from 'src/libs/dto/auth/login.dto';
import { UpdateProfileDto } from 'src/libs/dto/auth/update-profile.dto';
import { ChangePasswordDto } from 'src/libs/dto/auth/change-password.dto';
import { FindIdDto, FindIdByPhoneDto } from 'src/libs/dto/auth/find-id.dto';
import { FindPasswordDto, ResetPasswordDto } from 'src/libs/dto/auth/find-password.dto';
import { MemberType } from 'src/libs/enums/members.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly membersService: MembersService,
    private readonly jwtService: JwtService,
    @InjectRepository(Member)
    private readonly memberRepo: Repository<Member>,
  ) {}

  async signUp(dto: SignUpDto) {
    // 비밀번호 확인 검증
    if (dto.password !== dto.passwordConfirm) {
      throw new BadRequestException('비밀번호가 일치하지 않습니다. 다시 확인해주세요.');
    }

    const existing = await this.membersService.findByLoginId(dto.loginId);
    if (existing) {
      throw new BadRequestException('이미 사용 중인 ID 입니다.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 보험사 회원이면 isApproved=false 로 시작 (IA에 따라)
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
      throw new UnauthorizedException('ID 또는 비밀번호가 올바르지 않습니다. 다시 확인해주세요.');
    }

    const match = await bcrypt.compare(dto.password, member.passwordHash);
    if (!match) {
      throw new UnauthorizedException('ID 또는 비밀번호가 올바르지 않습니다. 다시 확인해주세요.');
    }

    if (!member.isApproved) {
      throw new UnauthorizedException('관리자 승인 대기 중인 계정입니다.');
    }

    const payload = {
      sub: member.id,
      loginId: member.loginId,
      memberType: member.memberType,
    };

    // 자동 로그인 여부에 따라 토큰 만료시간 조정
    const expiresIn = dto.autoLogin ? '30d' : '1d';
    const accessToken = await this.jwtService.signAsync(payload, { expiresIn });

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

  // 내 정보 조회
  async getMyProfile(userId: number) {
    const member = await this.membersService.findById(userId);
    const { passwordHash, ...profile } = member;
    return profile;
  }

  // 프로필 수정
  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const member = await this.membersService.findById(userId);
    
    if (dto.name) member.name = dto.name;
    if (dto.email) member.email = dto.email;
    if (dto.phoneNumber) member.phoneNumber = dto.phoneNumber;
    if (dto.affiliation) member.affiliation = dto.affiliation;

    await this.membersService.updateProfile(userId, member);
    
    const { passwordHash, ...profile } = member;
    return profile;
  }

  // 비밀번호 변경
  async changePassword(userId: number, dto: ChangePasswordDto) {
    // 비밀번호 확인 검증
    if (dto.newPassword !== dto.newPasswordConfirm) {
      throw new BadRequestException('비밀번호가 일치하지 않습니다. 다시 확인해주세요.');
    }

    const member = await this.membersService.findById(userId);

    const match = await bcrypt.compare(dto.currentPassword, member.passwordHash);
    if (!match) {
      throw new UnauthorizedException('현재 비밀번호가 올바르지 않습니다.');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);
    member.passwordHash = newPasswordHash;
    await this.membersService.updateProfile(userId, member);

    return { success: true, message: '비밀번호가 변경되었습니다.' };
  }

  // 아이디 찾기 (이메일 기반)
  async findIdByEmail(dto: FindIdDto) {
    const member = await this.memberRepo.findOne({
      where: { name: dto.name, email: dto.email },
    });

    if (!member) {
      throw new NotFoundException('입력하신 정보와 일치하는 회원이 없습니다.');
    }

    // 아이디 일부 마스킹 (예: user123 -> us***23)
    const loginId = member.loginId;
    const maskedLoginId = this.maskLoginId(loginId);

    return {
      success: true,
      loginId: maskedLoginId,
      message: '회원 정보가 확인되었습니다.',
    };
  }

  // 아이디 찾기 (휴대폰 기반)
  async findIdByPhone(dto: FindIdByPhoneDto) {
    const member = await this.memberRepo.findOne({
      where: { name: dto.name, phoneNumber: dto.phoneNumber },
    });

    if (!member) {
      throw new NotFoundException('입력하신 정보와 일치하는 회원이 없습니다.');
    }

    // 아이디 일부 마스킹
    const maskedLoginId = this.maskLoginId(member.loginId);

    return {
      success: true,
      loginId: maskedLoginId,
      message: '회원 정보가 확인되었습니다.',
    };
  }

  // 비밀번호 찾기 (인증 요청)
  async findPassword(dto: FindPasswordDto) {
    const member = await this.memberRepo.findOne({
      where: { loginId: dto.loginId, name: dto.name, email: dto.email },
    });

    if (!member) {
      throw new NotFoundException('입력하신 정보와 일치하는 회원이 없습니다.');
    }

    // 비밀번호 재설정 토큰 생성
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // TODO: 실제로는 이메일로 재설정 링크를 보내야 함
    // 여기서는 토큰을 반환 (실제 운영에서는 이메일 발송)

    return {
      success: true,
      message: '비밀번호 재설정 안내가 이메일로 발송되었습니다.',
      // 개발 환경에서만 토큰 반환 (운영에서는 제거)
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
    };
  }

  // 비밀번호 재설정
  async resetPassword(dto: ResetPasswordDto) {
    // 비밀번호 확인 검증
    if (dto.newPassword !== dto.newPasswordConfirm) {
      throw new BadRequestException('비밀번호가 일치하지 않습니다. 다시 확인해주세요.');
    }

    // TODO: 토큰 검증 로직 구현 (Redis 또는 DB에서 토큰 확인)
    // 현재는 간단한 구현
    if (!dto.token) {
      throw new BadRequestException('유효하지 않은 토큰입니다.');
    }

    // TODO: 토큰에서 회원 정보 추출 및 비밀번호 변경

    return {
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해주세요.',
    };
  }

  // 아이디 마스킹 헬퍼 함수
  private maskLoginId(loginId: string): string {
    if (loginId.length <= 4) {
      return loginId[0] + '***';
    }
    const start = loginId.slice(0, 2);
    const end = loginId.slice(-2);
    return `${start}${'*'.repeat(loginId.length - 4)}${end}`;
  }
}

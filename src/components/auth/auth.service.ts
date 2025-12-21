import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MembersService } from '../members/members.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from 'src/libs/entity/member.entity';
import { MemberStatus } from 'src/libs/enums/members.enum';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { VerificationService } from '../verification/verification.service';
import { RedisService } from 'src/libs/redis/redis.service';
import { EasyMailService } from '../newsletter/services/easy-mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly membersService: MembersService,
    private readonly jwtService: JwtService,
    private readonly verification: VerificationService,
    private readonly redisService: RedisService,
    private readonly easyMailService: EasyMailService,
    @InjectRepository(Member)
    private readonly memberRepo: Repository<Member>,
  ) {}

  // -------------------------------------
  // SIGN UP
  // -------------------------------------
  async signUp(dto) {
    if (dto.password !== dto.passwordConfirm)
      throw new BadRequestException('비밀번호가 일치하지 않습니다.');

    // Check loginId uniqueness
    const existingLoginId = await this.membersService.findByLoginId(dto.loginId);
    if (existingLoginId) throw new BadRequestException('이미 사용 중인 아이디입니다.');

    // Check email uniqueness
    const existingEmail = await this.membersService.findByEmail(dto.email);
    if (existingEmail) throw new BadRequestException('이미 등록된 이메일입니다.');

    // Check phoneNumber uniqueness
    const existingPhone = await this.membersService.findByPhoneNumber(dto.phoneNumber);
    if (existingPhone) throw new BadRequestException('이미 등록된 휴대폰 번호입니다.');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Save newsletter preference (default to false if not provided)
    const newsletterSubscribed = dto.newsletters === true;

    const member = await this.membersService.create({
      ...dto,
      passwordHash,
      isApproved: dto.memberType !== 'INSURANCE',
      newsletterSubscribed,
    });

    // If user opted in for newsletters, subscribe them to Easy Mail
    if (newsletterSubscribed) {
      try {
        await this.easyMailService.subscribeSubscriber(member.email, member.name);
      } catch (error) {
        // Log error but don't fail signup if Easy Mail fails
        console.error('Failed to subscribe to Easy Mail during signup:', error);
      }
    }

    return {
      id: member.id,
      loginId: member.loginId,
      name: member.name,
      memberType: member.memberType,
      isApproved: member.isApproved,
      newsletterSubscribed: member.newsletterSubscribed,
    };
  }

  // -------------------------------------
  // LOGIN
  // -------------------------------------
  async login(dto) {
    const member = await this.membersService.findByLoginId(dto.loginId);
    if (!member) throw new UnauthorizedException('ID 또는 비밀번호가 올바르지 않습니다.');

    // 탈퇴한 회원은 로그인 불가
    if (member.status === MemberStatus.WITHDRAWN) {
      throw new UnauthorizedException('탈퇴한 회원은 로그인할 수 없습니다.');
    }

    // SNS 로그인 사용자는 비밀번호가 없음
    if (!member.passwordHash) {
      throw new UnauthorizedException('SNS 로그인으로 가입한 계정입니다. SNS 로그인을 사용해주세요.');
    }

    const match = await bcrypt.compare(dto.password, member.passwordHash);
    if (!match) throw new UnauthorizedException('ID 또는 비밀번호가 올바르지 않습니다.');

    if (!member.isApproved)
      throw new UnauthorizedException('관리자 승인 대기 중입니다.');
    console.log("JWT SECRET", process.env.JWT_SECRET);

    const payload = {
      sub: member.id,
      loginId: member.loginId,
      memberType: member.memberType,
    };

    const token = await this.jwtService.signAsync(payload, {
      expiresIn: dto.autoLogin ? '30d' : '1d',
    });

    return { accessToken: token, member };
  }

  // -------------------------------------
  // MY PAGE
  // -------------------------------------
  async getMyProfile(id: number) {
    const member = await this.membersService.findById(id);
    const { passwordHash, ...profile } = member;
    return profile;
  }

  async updateProfile(id: number, dto) {
    return await this.membersService.updateProfile(id, dto);
  }

  async changePassword(id: number, dto) {
    if (dto.newPassword !== dto.newPasswordConfirm)
      throw new BadRequestException('비밀번호가 일치하지 않습니다.');

    const member = await this.membersService.findById(id);
    const match = await bcrypt.compare(dto.currentPassword, member.passwordHash);

    if (!match) throw new UnauthorizedException('현재 비밀번호가 올바르지 않습니다.');

    member.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.membersService.updateProfile(id, member);

    return { success: true };
  }

  // -------------------------------------
  // FIND ID
  // -------------------------------------
  async requestFindIdEmailVerification(dto) {
    const user = await this.memberRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new NotFoundException('등록된 회원이 없습니다.');

    await this.verification.sendCode('EMAIL', dto.email, 'FIND_ID');
    return { success: true };
  }

  async requestFindIdPhoneVerification(dto) {
    const user = await this.memberRepo.findOne({
      where: { phoneNumber: dto.phoneNumber },
    });
    if (!user) throw new NotFoundException('등록된 회원이 없습니다.');

    await this.verification.sendCode('PHONE', dto.phoneNumber, 'FIND_ID');
    return { success: true };
  }

  async findIdByEmail(dto) {
    await this.verification.verifyCode(dto.email, 'FIND_ID', dto.verificationCode);

    const user = await this.memberRepo.findOne({
      where: { name: dto.name, email: dto.email },
    });

    if (!user) throw new NotFoundException('정보가 일치하지 않습니다.');

    return { success: true, loginId: this.mask(user.loginId) };
  }

  async findIdByPhone(dto) {
    await this.verification.verifyCode(dto.phoneNumber, 'FIND_ID', dto.verificationCode);

    const user = await this.memberRepo.findOne({
      where: { name: dto.name, phoneNumber: dto.phoneNumber },
    });

    if (!user) throw new NotFoundException('정보가 일치하지 않습니다.');

    return { success: true, loginId: this.mask(user.loginId) };
  }

  // -------------------------------------
  // FIND PASSWORD
  // -------------------------------------
  async requestPasswordResetEmailVerification(dto) {
    const user = await this.memberRepo.findOne({
      where: { loginId: dto.loginId, email: dto.email },
    });

    if (!user) throw new NotFoundException('정보가 일치하지 않습니다.');

    await this.verification.sendCode('EMAIL', dto.email, 'RESET_PASSWORD');
    return { success: true };
  }

  async requestPasswordResetPhoneVerification(dto) {
    const user = await this.memberRepo.findOne({
      where: { loginId: dto.loginId, phoneNumber: dto.phoneNumber },
    });

    if (!user) throw new NotFoundException('정보가 일치하지 않습니다.');

    await this.verification.sendCode('PHONE', dto.phoneNumber, 'RESET_PASSWORD');
    return { success: true };
  }

  async findPasswordByEmail(dto) {
    await this.verification.verifyCode(dto.email, 'RESET_PASSWORD', dto.verificationCode);

    const user = await this.memberRepo.findOne({
      where: { loginId: dto.loginId, email: dto.email },
    });

    if (!user) throw new NotFoundException('정보가 일치하지 않습니다.');

    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Store reset token in Redis with 10 minutes expiration
    await this.redisService.setPasswordResetToken(user.id, resetToken, 600);

    return { success: true, resetToken };
  }

  async findPasswordByPhone(dto) {
    await this.verification.verifyCode(dto.phoneNumber, 'RESET_PASSWORD', dto.verificationCode);

    const user = await this.memberRepo.findOne({
      where: { loginId: dto.loginId, phoneNumber: dto.phoneNumber },
    });

    if (!user) throw new NotFoundException('정보가 일치하지 않습니다.');

    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Store reset token in Redis with 10 minutes expiration
    await this.redisService.setPasswordResetToken(user.id, resetToken, 600);

    return { success: true, resetToken };
  }

  async resetPassword(dto) {
    if (dto.newPassword !== dto.newPasswordConfirm)
      throw new BadRequestException('비밀번호가 일치하지 않습니다.');

    // Validate reset token from Redis
    const userId = await this.redisService.getPasswordResetToken(dto.token);
    
    if (!userId) {
      throw new BadRequestException('유효하지 않거나 만료된 토큰입니다.');
    }

    // Find user and update password
    const user = await this.memberRepo.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // Update password
    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.memberRepo.save(user);

    // Delete the reset token from Redis
    await this.redisService.deletePasswordResetToken(dto.token);

    return { success: true };
  }

  // ----------------------------
  // UTIL
  // ----------------------------
  private mask(loginId: string) {
    if (loginId.length <= 4) return loginId[0] + '***';
    return loginId.slice(0, 2) + '***' + loginId.slice(-2);
  }
}

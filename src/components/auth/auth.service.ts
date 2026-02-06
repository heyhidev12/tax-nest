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
import { NewsletterService } from '../newsletter/newsletter.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly membersService: MembersService,
    private readonly jwtService: JwtService,
    private readonly verification: VerificationService,
    private readonly redisService: RedisService,
    private readonly newsletterService: NewsletterService,
    @InjectRepository(Member)
    private readonly memberRepo: Repository<Member>,
  ) { }

  // -------------------------------------
  // SIGN UP
  // -------------------------------------
  async signUp(dto) {
    if (dto.password !== dto.passwordConfirm)
      throw new BadRequestException('비밀번호가 일치하지 않습니다.');

    // Check if ACTIVE user exists by email OR loginId OR phoneNumber
    const existingByLoginId = await this.membersService.findActiveByLoginId(dto.loginId);
    const existingByEmail = await this.membersService.findActiveByEmail(dto.email);
    const existingByPhone = await this.membersService.findActiveByPhoneNumber(dto.phoneNumber);

    // If any ACTIVE user exists with these credentials, block signup
    if (existingByLoginId || existingByEmail || existingByPhone) {
      throw new BadRequestException('이미 등록된 계정입니다.');
    }

    // Check if WITHDRAWN user exists (to reactivate)
    const withdrawnByLoginId = await this.membersService.findByLoginId(dto.loginId);
    const withdrawnByEmail = await this.membersService.findByEmail(dto.email);
    const withdrawnByPhone = await this.membersService.findByPhoneNumber(dto.phoneNumber);

    // Find any existing WITHDRAWN user (prioritize loginId, then email, then phone)
    const existingUser = withdrawnByLoginId || withdrawnByEmail || withdrawnByPhone;

    const passwordHash = await bcrypt.hash(dto.password, 10);
    // Explicitly convert to boolean - only true if explicitly true, otherwise false
    const newsletterSubscribed = dto.newsletterSubscribed === true;


    let member: Member;

    // Case 1: WITHDRAWN user exists - Reactivate
    if (existingUser && existingUser.status === MemberStatus.WITHDRAWN) {
      // Reactivate existing account - DO NOT create new DB row
      existingUser.passwordHash = passwordHash;
      existingUser.name = dto.name;
      existingUser.email = dto.email;
      existingUser.loginId = dto.loginId;
      existingUser.phoneNumber = dto.phoneNumber;
      existingUser.memberType = dto.memberType;
      existingUser.status = MemberStatus.ACTIVE;
      existingUser.isApproved = dto.memberType !== 'INSURANCE';
      existingUser.newsletterSubscribed = newsletterSubscribed;

      member = await this.memberRepo.save(existingUser);
    } else {
      // Case 2: User does not exist - Normal signup flow
      // Explicitly pass only needed fields (don't use spread to avoid unwanted fields)
      member = await this.membersService.create({
        loginId: dto.loginId,
        name: dto.name,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        memberType: dto.memberType,
        passwordHash,
        isApproved: dto.memberType !== 'INSURANCE',
        newsletterSubscribed,
        status: MemberStatus.ACTIVE,
      });
    }

    // If user opted in for newsletters, subscribe them via newsletter service (DB + provider)
    // IMPORTANT: This must happen AFTER member is saved to DB so newsletter service can sync
    if (newsletterSubscribed) {
      try {
        await this.newsletterService.subscribe(member.name, member.email);
      } catch (error) {
        // Log error but don't fail signup if newsletter sync fails
        console.error('Failed to subscribe to newsletter during signup:', error);
      }
    }

    return {
      id: member.id,
      loginId: member.loginId,
      name: member.name,
      memberType: member.memberType,
      isApproved: member.isApproved,
      newsletterSubscribed: newsletterSubscribed, // Use computed value, not member.newsletterSubscribed
    };
  }

  async checkLoginIdExists(loginId: string) {
    // Only check against ACTIVE users (ignore WITHDRAWN users)
    const existing = await this.membersService.findActiveByLoginId(loginId);
    return { exists: !!existing };
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

    console.log("JWT SECRET", process.env.JWT_SECRET);

    const payload = {
      sub: member.id,
      loginId: member.loginId,
      memberType: member.memberType,
    };

    // Generate access token (short-lived)
    const accessTokenExpiresIn = dto.autoLogin ? '7d' : '15m';
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: accessTokenExpiresIn,
    });

    let refreshToken: string | null = null;
    let refreshTokenExpiresIn: number | null = null;

    if (dto.autoLogin) {
      refreshToken = crypto.randomBytes(64).toString('hex');
      refreshTokenExpiresIn = dto.autoLogin
        ? 60 * 60 * 24 * 7  // 7 days for autoLogin = true
        : 60 * 15;          // 15 minutes for autoLogin = false

      // Store refresh token in Redis
      const refreshTokenKey = `refresh_token:${refreshToken}`;
      await this.redisService.set(refreshTokenKey, JSON.stringify({
        userId: member.id,
        loginId: member.loginId,
        createdAt: new Date().toISOString(),
        autoLogin: dto.autoLogin, // Store autoLogin status
      }), refreshTokenExpiresIn);
    }

    const safeMember = {
      id: member.id,
      loginId: member.loginId,
      name: member.name,
      email: member.email,
      memberType: member.memberType,
      status: member.status,
      isApproved: member.isApproved,
    };

    return {
      accessToken,
      refreshToken,
      refreshTokenExpiresIn,
      autoLogin: dto.autoLogin || false,
      member: safeMember
    };
  }

  // -------------------------------------
  // REFRESH TOKEN
  // -------------------------------------
  async refreshAccessToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('리프레시 토큰이 필요합니다.');
    }

    // Find user by refresh token in Redis
    const refreshTokenKey = `refresh_token:${refreshToken}`;
    const tokenData = await this.redisService.get(refreshTokenKey);

    if (!tokenData) {
      throw new UnauthorizedException('유효하지 않거나 만료된 리프레시 토큰입니다.');
    }

    const parsedData = JSON.parse(tokenData);
    const userId = parsedData.userId;
    const autoLogin = parsedData.autoLogin || false; // Get autoLogin status

    // Verify user still exists and is active
    const member = await this.membersService.findById(userId);
    if (!member || member.status === MemberStatus.WITHDRAWN) {
      // Clear invalid refresh token
      await this.redisService.del(refreshTokenKey);
      throw new UnauthorizedException('사용자를 찾을 수 없거나 탈퇴한 회원입니다.');
    }

    // Generate new access token with same autoLogin duration
    const payload = {
      sub: member.id,
      loginId: member.loginId,
      memberType: member.memberType,
    };

    const accessTokenExpiresIn = autoLogin ? '7d' : '15m';
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: accessTokenExpiresIn,
    });

    const safeMember = {
      id: member.id,
      loginId: member.loginId,
      name: member.name,
      email: member.email,
      memberType: member.memberType,
      status: member.status,
      isApproved: member.isApproved,
    };

    return { accessToken, member: safeMember };
  }

  // -------------------------------------
  // LOGOUT
  // -------------------------------------
  async logout(refreshToken?: string) {
    // Clear refresh token from Redis if provided
    if (refreshToken) {
      const refreshTokenKey = `refresh_token:${refreshToken}`;
      await this.redisService.del(refreshTokenKey);
    }

    return { success: true, message: '로그아웃 되었습니다.' };
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

  async sendPhoneVerification(dto, isAuthenticated: boolean) {
    const purpose = isAuthenticated ? 'CHANGE_PHONE' : 'SIGNUP';
    return await this.verification.sendCode('PHONE', dto.phone, purpose);
  }

  async verifyPhoneCode(dto, isAuthenticated: boolean) {
    const purpose = isAuthenticated ? 'CHANGE_PHONE' : 'SIGNUP';

    // Verify the code first
    await this.verification.verifyCode(dto.phone, purpose, dto.code);

    // For signup flow, check if phone number is already registered (only check ACTIVE users)
    if (purpose === 'SIGNUP') {
      const existingPhone = await this.membersService.findActiveByPhoneNumber(dto.phone);
      if (existingPhone) {
        throw new BadRequestException({
          statusCode: 400,
          errorCode: 'PHONE_ALREADY_REGISTERED',
          message: '이미 등록된 휴대폰 번호입니다',
        });
      }
    }

    return { verified: true };
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

  async verifyPassword(id: number, dto) {
    const rateLimitKey = `rate_limit:verify-password:${id}`;
    const attempts = await this.redisService.get(rateLimitKey);

    if (attempts && parseInt(attempts, 10) >= 5) {
      throw new BadRequestException('비밀번호 확인 시도가 너무 많습니다. 5분 후에 다시 시도해주세요.');
    }

    const member = await this.membersService.findById(id);

    // SNS 로그인 사용자는 비밀번호가 없음
    if (!member.passwordHash) {
      throw new BadRequestException('SNS 로그인으로 가입한 계정입니다.');
    }

    const match = await bcrypt.compare(dto.password, member.passwordHash);
    if (!match) {
      // 실패 시 시도 횟수 증가 (5분간 유지)
      const currentAttempts = attempts ? parseInt(attempts, 10) + 1 : 1;
      await this.redisService.set(rateLimitKey, currentAttempts.toString(), 300);
      throw new UnauthorizedException('비밀번호가 올바르지 않습니다.');
    }

    // 성공 시 시도 횟수 초기화
    await this.redisService.del(rateLimitKey);

    return { verified: true };
  }

  async withdrawAccount(id: number, dto: { password: string }) {
    const member = await this.membersService.findById(id);

    // Check if already withdrawn
    if (member.status === MemberStatus.WITHDRAWN) {
      throw new BadRequestException('이미 탈퇴한 회원입니다.');
    }

    // SNS 로그인 사용자는 비밀번호가 없음 - allow withdrawal without password verification
    if (!member.passwordHash) {
      // For SNS users, proceed with withdrawal without password verification
      member.status = MemberStatus.WITHDRAWN;
      await this.membersService.updateProfile(id, member);
      return { success: true };
    }

    // Verify password for regular users
    const match = await bcrypt.compare(dto.password, member.passwordHash);
    if (!match) {
      throw new BadRequestException({
        statusCode: 400,
        errorCode: 'INVALID_PASSWORD',
        message: '비밀번호가 일치하지 않습니다.',
      });
    }

    // Process withdrawal (soft delete)
    member.status = MemberStatus.WITHDRAWN;
    await this.membersService.updateProfile(id, member);

    // Note: JWT tokens are stateless, so we can't invalidate them server-side
    // However, the JWT strategy now checks member status during validation
    // The token will effectively be invalidated because withdrawn members can't use it

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

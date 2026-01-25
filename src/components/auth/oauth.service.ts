import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Member } from 'src/libs/entity/member.entity';
import { MemberStatus, MemberType } from 'src/libs/enums/members.enum';

export interface OAuthProfile {
  provider: 'google' | 'kakao' | 'naver';
  providerId: string;
  email: string;
  name: string;
  profileImage?: string;
}

@Injectable()
export class OAuthService {
  constructor(
    @InjectRepository(Member)
    private readonly memberRepo: Repository<Member>,
    private readonly jwtService: JwtService,
  ) {}

  async validateOAuthLogin(profile: OAuthProfile) {
    // 1. Find user by provider + providerId OR email (single query with OR)
    const member = await this.memberRepo.findOne({
      where: [
        {
          provider: profile.provider,
          providerId: profile.providerId,
        },
        {
          email: profile.email,
        },
      ],
    });

    // 2. ✅ USER EXISTS → LOGIN ONLY (do NOT update any fields)
    if (member) {
      console.log('SNS LOGIN USER FOUND:', member.id);

      // Check if withdrawn - redirect to signup with error
      if (member.status === MemberStatus.WITHDRAWN) {
        throw new UnauthorizedException({
          message: '탈퇴한 회원은 로그인할 수 없습니다.',
          redirectTo: 'signup',
          error: 'WITHDRAWN',
        });
      }

      // Link provider if user signed up normally before (only update provider fields)
      if (!member.provider || !member.providerId) {
        member.provider = profile.provider;
        member.providerId = profile.providerId;
        await this.memberRepo.save(member);
      }

      // Generate JWT and return (do NOT update name, email, or any other fields)
      return this.generateLoginResponse(member);
    }

    // 3. ❌ USER DOES NOT EXIST → REDIRECT TO SIGNUP (NEVER CREATE AUTO)
    console.log('SNS LOGIN USER NOT FOUND - REDIRECT TO SIGNUP');

    throw new UnauthorizedException({
      message: '등록되지 않은 사용자입니다.',
      redirectTo: 'signup',
      error: 'NOT_REGISTERED',
      email: profile.email,
      provider: profile.provider,
    });
  }

  private async generateLoginResponse(member: Member) {
    const payload = {
      sub: member.id,
      loginId: member.loginId,
      memberType: member.memberType,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '30d',
    });

    return {
      accessToken,
      member: {
        id: member.id,
        loginId: member.loginId,
        name: member.name,
        email: member.email,
        provider: member.provider,
      },
    };
  }
}

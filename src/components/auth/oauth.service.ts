import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Member } from 'src/libs/entity/member.entity';
import { MemberType } from 'src/libs/enums/members.enum';

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
    // Check if user exists with this provider and providerId
    let member = await this.memberRepo.findOne({
      where: {
        provider: profile.provider,
        providerId: profile.providerId,
      },
    });

    if (member) {
      // Existing user - update profile if needed
      if (member.email !== profile.email || member.name !== profile.name) {
        member.email = profile.email;
        member.name = profile.name;
        await this.memberRepo.save(member);
      }
    } else {
      // Check if email already exists (for account linking)
      const existingByEmail = await this.memberRepo.findOne({
        where: { email: profile.email },
      });

      if (existingByEmail) {
        // Link SNS account to existing account
        existingByEmail.provider = profile.provider;
        existingByEmail.providerId = profile.providerId;
        await this.memberRepo.save(existingByEmail);
        member = existingByEmail;
      } else {
        // Create new user
        // Generate a unique loginId from email
        const loginId = this.generateLoginIdFromEmail(profile.email);
        
        // Check if loginId already exists
        let finalLoginId = loginId;
        let counter = 1;
        while (await this.memberRepo.findOne({ where: { loginId: finalLoginId } })) {
          finalLoginId = `${loginId}${counter}`;
          counter++;
        }

        member = this.memberRepo.create({
          loginId: finalLoginId,
          passwordHash: undefined, // SNS users don't have password
          name: profile.name,
          email: profile.email,
          phoneNumber: '', // Will be filled later
          memberType: MemberType.GENERAL,
          isApproved: true, // SNS users are auto-approved
          provider: profile.provider,
          providerId: profile.providerId,
        });

        member = await this.memberRepo.save(member);
      }
    }

    // Generate JWT token
    const payload = {
      sub: member.id,
      loginId: member.loginId,
      memberType: member.memberType,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '30d', // SNS login uses longer expiration
    });

    return {
      accessToken,
      member: {
        id: member.id,
        loginId: member.loginId,
        name: member.name,
        email: member.email,
        memberType: member.memberType,
        provider: member.provider,
      },
    };
  }

  private generateLoginIdFromEmail(email: string): string {
    // Extract username part from email and make it unique
    const username = email.split('@')[0];
    // Remove special characters and limit length
    return username.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20) || 'user';
  }
}

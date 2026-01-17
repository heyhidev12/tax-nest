import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from 'src/libs/entity/member.entity';
import { MemberStatus } from 'src/libs/enums/members.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(Member)
    private readonly memberRepo: Repository<Member>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'dev-secret',
    });
  }

  async validate(payload: any) {
    // payload에는 우리가 토큰 생성할 때 넣은 데이터가 들어감
    // ex) { sub: memberId, loginId, memberType }
    
    // Check if member exists and is not withdrawn
    const member = await this.memberRepo.findOne({ where: { id: payload.sub } });
    if (!member || member.status === MemberStatus.WITHDRAWN) {
      throw new UnauthorizedException('탈퇴한 회원이거나 유효하지 않은 토큰입니다.');
    }

    return { sub: payload.sub, loginId: payload.loginId, memberType: payload.memberType };
  }
}

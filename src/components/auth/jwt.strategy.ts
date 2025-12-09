import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'dev-secret',
    });
  }

  async validate(payload: any) {
    // payload에는 우리가 토큰 생성할 때 넣은 데이터가 들어감
    // ex) { sub: memberId, loginId, memberType }
    return { sub: payload.sub, loginId: payload.loginId, memberType: payload.memberType };
  }
}

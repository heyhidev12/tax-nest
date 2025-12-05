import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.ADMIN_JWT_SECRET || 'admin-dev-secret',
    });
  }

  async validate(payload: any) {
    // payload: { sub: adminId, loginId, role: 'ADMIN' }
    return { adminId: payload.sub, loginId: payload.loginId, role: payload.role };
  }
}

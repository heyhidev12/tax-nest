import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { AdminAuthService } from './admin-auth.service';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(private readonly adminAuthService: AdminAuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: Request) => {
          return request?.cookies?.access_token;
        },
      ]),
      secretOrKey: process.env.ADMIN_JWT_SECRET || 'admin-dev-secret',
    });
  }

  async validate(payload: any) {
    if (payload.type !== 'admin') {
      throw new UnauthorizedException('관리자 토큰이 아닙니다.');
    }

    const admin = await this.adminAuthService.findById(payload.sub);
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('유효하지 않은 관리자입니다.');
    }

    return {
      id: payload.sub,
      role: payload.role,
      permissions: admin.permissions,
    };
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AdminUser } from 'src/libs/entity/admin-user.entity';
import { AdminLoginDto } from 'src/libs/dto/admin/admin-login.dto';

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectRepository(AdminUser)
    private readonly adminRepo: Repository<AdminUser>,
    private readonly jwtService: JwtService,
  ) {}

  async validateAdmin(loginId: string, password: string): Promise<AdminUser> {
    const admin = await this.adminRepo.findOne({ where: { loginId, isActive: true } });
    if (!admin) {
      throw new UnauthorizedException('ID 또는 비밀번호가 올바르지 않습니다.');
    }

    const match = await bcrypt.compare(password, admin.passwordHash);
    if (!match) {
      throw new UnauthorizedException('ID 또는 비밀번호가 올바르지 않습니다.');
    }

    return admin;
  }

  async login(dto: AdminLoginDto) {
    const admin = await this.validateAdmin(dto.loginId, dto.password);

    const payload = {
      sub: admin.id,
      loginId: admin.loginId,
      role: 'ADMIN',
    };

    const token = await this.jwtService.signAsync(payload);

    return {
      accessToken: token,
      admin: {
        id: admin.id,
        loginId: admin.loginId,
        name: admin.name,
      },
    };
  }
}

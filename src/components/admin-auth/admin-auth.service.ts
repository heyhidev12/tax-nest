import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AdminUser } from 'src/libs/entity/admin-user.entity';
import { AdminLoginDto } from 'src/libs/dto/admin/admin-login.dto';
import { CreateAdminDto } from 'src/libs/dto/admin/create-admin.dto';
import { AdminUpdateProfileDto } from 'src/libs/dto/admin/admin-update-profile.dto';
import { AdminChangePasswordDto } from 'src/libs/dto/admin/admin-change-password.dto';
import { AdminRole } from 'src/libs/enums/admin.enum';

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectRepository(AdminUser)
    private readonly adminRepo: Repository<AdminUser>,
    private readonly jwtService: JwtService,
  ) { }

  async validateAdmin(loginId: string, password: string): Promise<AdminUser> {
    const admin = await this.adminRepo.findOne({ where: { loginId, isActive: true } });
    if (!admin) {
      throw new UnauthorizedException('ID 또는 비밀번호가 올바르지 않습니다. 다시 확인해주세요.');
    }

    const match = await bcrypt.compare(password, admin.passwordHash);
    if (!match) {
      throw new UnauthorizedException('ID 또는 비밀번호가 올바르지 않습니다. 다시 확인해주세요.');
    }

    return admin;
  }

  async login(dto: AdminLoginDto) {
    const admin = await this.validateAdmin(dto.loginId, dto.password);
    return this.generateAuthTokens(admin);
  }

  async generateAuthTokens(admin: AdminUser) {
    const payload = {
      sub: admin.id,
      role: admin.role,
      type: 'admin',
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.ADMIN_JWT_SECRET || 'admin-dev-secret',
      expiresIn: '30m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.ADMIN_REFRESH_SECRET || 'admin-refresh-dev-secret',
      expiresIn: '30d',
    });

    return {
      accessToken,
      refreshToken,
      admin: {
        loginId: admin.loginId,
        name: admin.name,
        role: admin.role,
        permissions: admin.permissions || {},
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.ADMIN_REFRESH_SECRET || 'admin-refresh-dev-secret',
      });

      if (payload.type !== 'admin') {
        throw new UnauthorizedException('관리자 토큰이 아닙니다.');
      }

      const admin = await this.findById(payload.sub);
      if (!admin || !admin.isActive) {
        throw new UnauthorizedException('유효하지 않은 관리자입니다.');
      }

      return this.generateAuthTokens(admin);
    } catch (e) {
      throw new UnauthorizedException('유효하지 않거나 만료된 리프레시 토큰입니다.');
    }
  }

  async findById(id: number) {
    const admin = await this.adminRepo.findOne({ where: { id } });
    if (!admin) {
      throw new NotFoundException('관리자를 찾을 수 없습니다.');
    }
    return admin;
  }

  // 내 정보 조회 (마이페이지)
  async getMyProfile(adminId: number) {
    const admin = await this.findById(adminId);
    return {
      loginId: admin.loginId,
      name: admin.name,
      role: admin.role,
      permissions: admin.permissions || {},
      createdAt: admin.createdAt,
    };
  }

  // 내 정보 수정 (이름)
  async updateMyProfile(adminId: number, dto: AdminUpdateProfileDto) {
    const admin = await this.findById(adminId);

    if (dto.name) {
      admin.name = dto.name;
    }

    await this.adminRepo.save(admin);

    return {
      success: true,
      message: '정보가 수정되었습니다.',
      admin: {
        id: admin.id,
        loginId: admin.loginId,
        name: admin.name,
        role: admin.role,
      },
    };
  }

  // 비밀번호 변경
  async changePassword(adminId: number, dto: AdminChangePasswordDto) {
    // 비밀번호 확인 검증
    if (dto.newPassword !== dto.newPasswordConfirm) {
      throw new BadRequestException('비밀번호가 일치하지 않습니다. 다시 확인해주세요.');
    }

    const admin = await this.findById(adminId);

    const match = await bcrypt.compare(dto.currentPassword, admin.passwordHash);
    if (!match) {
      throw new UnauthorizedException('현재 비밀번호가 올바르지 않습니다.');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);
    admin.passwordHash = newPasswordHash;
    await this.adminRepo.save(admin);

    return { success: true, message: '비밀번호가 변경되었습니다.' };
  }

  async create(dto: CreateAdminDto) {
    const existing = await this.adminRepo.findOne({ where: { loginId: dto.loginId } });
    if (existing) {
      throw new BadRequestException('이미 사용 중인 아이디입니다.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const admin = this.adminRepo.create({
      loginId: dto.loginId,
      passwordHash,
      name: dto.name,
      role: dto.role ?? AdminRole.ADMIN,
      permissions: dto.permissions || {},
    });

    const saved = await this.adminRepo.save(admin);

    return {
      id: saved.id,
      loginId: saved.loginId,
      role: saved.role,
      isActive: saved.isActive,
      permissions: saved.permissions,
      createdAt: saved.createdAt,
    };
  }

  async list(page = 1, limit = 20) {
    const [items, total] = await this.adminRepo.findAndCount({
      select: ['id', 'loginId', 'role', 'isActive', 'permissions', 'createdAt'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Format response to match requirements: id, loginId, role, isActive, permissions, createdAt
    const formattedItems = items.map((item) => ({
      id: item.id,
      loginId: item.loginId,
      role: item.role,
      isActive: item.isActive,
      permissions: item.permissions || {},
      createdAt: item.createdAt,
    }));

    return { items: formattedItems, total, page, limit };
  }

  async delete(id: number, currentAdminId: number) {
    const admin = await this.findById(id);

    // Prevent SUPER_ADMIN from deleting their own account
    if (admin.id === currentAdminId) {
      throw new BadRequestException('자신의 계정은 삭제할 수 없습니다.');
    }

    await this.adminRepo.remove(admin);
    return { success: true, message: '관리자가 삭제되었습니다.' };
  }

  async updatePermissions(id: number, permissions: Record<string, boolean>) {
    const admin = await this.findById(id);
    admin.permissions = permissions;
    await this.adminRepo.save(admin);
    return { success: true };
  }

  async toggleActive(id: number, currentAdminId: number) {
    const admin = await this.findById(id);

    // Prevent deactivating the currently logged-in SUPER_ADMIN
    if (admin.id === currentAdminId && admin.role === AdminRole.SUPER_ADMIN) {
      throw new BadRequestException('현재 로그인한 최고관리자 계정은 비활성화할 수 없습니다.');
    }

    admin.isActive = !admin.isActive;
    await this.adminRepo.save(admin);
    return { success: true, isActive: admin.isActive };
  }

  // 초기 SUPER_ADMIN 생성
  async seedSuperAdmin() {
    const existing = await this.adminRepo.findOne({
      where: { role: AdminRole.SUPER_ADMIN },
    });

    if (!existing) {
      const passwordHash = await bcrypt.hash('admin1234!', 10);
      const superAdmin = this.adminRepo.create({
        loginId: 'superadmin',
        passwordHash,
        name: '최고관리자',
        role: AdminRole.SUPER_ADMIN,
      });
      await this.adminRepo.save(superAdmin);
      console.log('✅ Super admin created: superadmin / admin1234!');
    }
  }
}

import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AdminUser } from 'src/libs/entity/admin-user.entity';
import { AdminLoginDto } from 'src/libs/dto/admin/admin-login.dto';
import { CreateAdminDto } from 'src/libs/dto/admin/create-admin.dto';
import { AdminRole } from 'src/libs/enums/admin.enum';

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
      role: admin.role,
      type: 'admin',
    };

    const token = await this.jwtService.signAsync(payload);

    return {
      accessToken: token,
      admin: {
        id: admin.id,
        loginId: admin.loginId,
        name: admin.name,
        role: admin.role,
      },
    };
  }

  async findById(id: number) {
    const admin = await this.adminRepo.findOne({ where: { id } });
    if (!admin) {
      throw new NotFoundException('관리자를 찾을 수 없습니다.');
    }
    return admin;
  }

  async create(dto: CreateAdminDto) {
    const existing = await this.adminRepo.findOne({ where: { loginId: dto.loginId } });
    if (existing) {
      throw new BadRequestException('이미 사용 중인 ID입니다.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const admin = this.adminRepo.create({
      loginId: dto.loginId,
      passwordHash,
      name: dto.name,
      role: dto.role ?? AdminRole.ADMIN,
    });

    const saved = await this.adminRepo.save(admin);

    return {
      id: saved.id,
      loginId: saved.loginId,
      name: saved.name,
      role: saved.role,
    };
  }

  async list(page = 1, limit = 20) {
    const [items, total] = await this.adminRepo.findAndCount({
      select: ['id', 'loginId', 'name', 'role', 'isActive', 'permissions', 'createdAt'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total, page, limit };
  }

  async delete(id: number) {
    const admin = await this.findById(id);
    if (admin.role === AdminRole.SUPER_ADMIN) {
      throw new BadRequestException('최고관리자는 삭제할 수 없습니다.');
    }
    await this.adminRepo.remove(admin);
    return { success: true };
  }

  async updatePermissions(id: number, permissions: Record<string, boolean>) {
    const admin = await this.findById(id);
    admin.permissions = permissions;
    await this.adminRepo.save(admin);
    return { success: true };
  }

  async toggleActive(id: number) {
    const admin = await this.findById(id);
    if (admin.role === AdminRole.SUPER_ADMIN) {
      throw new BadRequestException('최고관리자는 비활성화할 수 없습니다.');
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
      const passwordHash = await bcrypt.hash('admin1234', 10);
      await this.adminRepo.save({
        loginId: 'superadmin',
        passwordHash,
        name: '최고관리자',
        role: AdminRole.SUPER_ADMIN,
      });
      console.log('✅ Super admin created: superadmin / admin1234');
    }
  }
}

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminRole } from 'src/libs/enums/admin.enum';
import { ROLES_KEY } from './decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AdminRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access (only JwtAuthGuard is needed)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    // Ensure user has role property
    if (!user || !user.role) {
      throw new ForbiddenException('권한 정보가 없습니다.');
    }

    // SUPER_ADMIN has access to everything
    if (user.role === AdminRole.SUPER_ADMIN) {
      return true;
    }

    // Check if user's role is in the required roles
    if (requiredRoles.includes(user.role)) {
      return true;
    }

    // Access denied
    throw new ForbiddenException('이 작업을 수행할 권한이 없습니다.');
  }
}
















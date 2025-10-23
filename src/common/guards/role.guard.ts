import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { AccessTokenPayload } from 'src/auth/interfaces/access-token-payload';
import { HAS_ROLE_KEY } from '../decorators/role.decorator';
import { RoleName } from '@prisma/client';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const isPublicRoute = request['public_route'] as boolean;
    if (isPublicRoute) return true;
    const rolesRequired = this.reflector.getAllAndOverride<RoleName[]>(
      HAS_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!rolesRequired) return true;
    const user = request['user'] as AccessTokenPayload;
    if (!user)
      throw new UnauthorizedException(
        'Vui lòng đăng nhập để truy cập trang nay',
      );
    if (!this.hasRole(rolesRequired, user.role))
      throw new ForbiddenException('Bạn không có quyền truy cập');
    return true;
  }
  private hasRole(rolesRequired: RoleName[], userRole: string): boolean {
    return rolesRequired.some(
      (roleRequired) => roleRequired.toLowerCase() === userRole.toLowerCase(),
    );
  }
}

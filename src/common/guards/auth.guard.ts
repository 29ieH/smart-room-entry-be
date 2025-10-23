import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuthService } from 'src/auth/auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { extractTokenFromHeader } from '../utils/jwt.util';
import { isPublicRoute } from '../helpers/auth.helper';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly prismaService: PrismaService,
    private readonly reflector: Reflector,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    if (isPublicRoute(this.reflector, context)) {
      request['public_route'] = true;
      return true;
    }
    let token = extractTokenFromHeader(request);
    if (!token && request.cookies) {
      token = request.cookies['accessToken'] as string;
    }
    if (!token) throw new UnauthorizedException('Vui lòng đăng nhập');
    const user = await this.authService.verifyToken(token);
    request['user'] = user;
    return true;
  }
}

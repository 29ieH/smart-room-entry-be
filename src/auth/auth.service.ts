import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions, JwtVerifyOptions } from '@nestjs/jwt';
import { comparePassword } from 'src/common/helpers/bcrypt.helper';
import { CustomLogger } from 'src/core/logger.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginInfoRequest } from './dto/request/login-info.request';
import { LoginInfoResponse } from './dto/response/login-info.response';
import { AccessTokenPayload } from './interfaces/access-token-payload';
import { UserValidate } from './interfaces/user-validate';
@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: CustomLogger,
    private readonly jwtService: JwtService,
  ) {}
  async login(dto: LoginInfoRequest): Promise<LoginInfoResponse> {
    const user = await this.prismaService.account.findUnique({
      where: {
        userName: dto.userName,
      },
      include: {
        role: {
          select: {
            roleName: true,
          },
        },
      },
    });
    if (!user) {
      throw new BadRequestException('Tài khoản không hợp lệ');
    }
    const comparedPassword = await comparePassword(
      dto.password,
      user.password,
      this.logger,
    );
    if (!comparedPassword)
      throw new BadRequestException('Tài khoản không hợp lệ');
    const tokenPayload: AccessTokenPayload = {
      sub: user.id,
      userName: user.userName,
      role: user.role.roleName,
    };
    const token = await this.generateAccessToken(tokenPayload);
    const response: LoginInfoResponse = {
      token,
      user: {
        id: user.id,
        userName: user.userName,
        role: user.role.roleName,
      },
    };
    return response;
  }
  async generateAccessToken(
    payload: AccessTokenPayload,
    options?: JwtSignOptions,
  ) {
    return await this.jwtService.signAsync(payload, options);
  }
  async verifyToken(
    token: string,
    options?: JwtVerifyOptions,
  ): Promise<UserValidate> {
    try {
      return await this.jwtService.verifyAsync<UserValidate>(token, options);
    } catch (error) {
      this.logger.error('Verify token failed', JSON.stringify(error));
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
  }
}

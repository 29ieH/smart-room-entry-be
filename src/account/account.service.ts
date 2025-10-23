import { BadRequestException, Injectable } from '@nestjs/common';
import { AccountStatus, Prisma, RoleName } from '@prisma/client';
import { hashPassword } from 'src/common/helpers/bcrypt.helper';
import { CustomLogger } from 'src/core/logger.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AccountCreationRequest } from './dto/request/account-creation.request';
import { AccountSummaryResponse } from './dto/response/account-creation.response';
import { AccessTokenPayload } from 'src/auth/interfaces/access-token-payload';

@Injectable()
export class AccountService {
  constructor(
    private readonly logger: CustomLogger,
    private readonly prismaService: PrismaService,
  ) {}
  async create(dto: AccountCreationRequest): Promise<AccountSummaryResponse> {
    const hashedPassword = await hashPassword(dto.password, this.logger);
    const data: Prisma.AccountCreateInput = {
      name: dto.name,
      userName: dto.userName,
      password: hashedPassword,
      status: AccountStatus.ACTIVE,
      role: { connect: { roleName: dto.role } },
    };
    const accountCreated = await this.prismaService.account.create({
      data: data,
      include: {
        role: {
          select: {
            roleName: true,
          },
        },
      },
    });
    const response: AccountSummaryResponse = {
      id: accountCreated.id,
      name: accountCreated.name,
      userName: accountCreated.userName,
      status: accountCreated.status,
      role: accountCreated.role.roleName,
    };
    return response;
  }
  async getAdmins(): Promise<AccountSummaryResponse[] | []> {
    const admins = await this.prismaService.account.findMany({
      where: {
        role: { roleName: RoleName.ADMIN },
        status: AccountStatus.ACTIVE,
      },
      include: {
        role: {
          select: {
            roleName: true,
          },
        },
      },
    });
    return admins.map((admin) => ({
      id: admin.id,
      name: admin.name,
      userName: admin.userName,
      status: admin.status,
      role: admin.role.roleName,
    }));
  }
  async getMe(user: AccessTokenPayload): Promise<AccountSummaryResponse> {
    const account = await this.prismaService.account.findUnique({
      where: { id: user.sub },
      include: {
        role: true,
      },
    });
    if (!account) throw new BadRequestException('Tài khoản không hợp lệ');
    return {
      id: account.id,
      name: account.name,
      userName: account.userName,
      status: account.status,
      role: account.role.roleName,
    };
  }
}

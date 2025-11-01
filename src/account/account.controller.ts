import { Body, Controller, Get, Post } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountCreationRequest } from './dto/request/account-creation.request';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AccessTokenPayload } from 'src/auth/interfaces/access-token-payload';
import { IsPublicRoute } from 'src/common/decorators/public-route.decorator';

@Controller('/accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}
  @IsPublicRoute()
  @Post('')
  async createAccount(@Body() dto: AccountCreationRequest) {
    return this.accountService.create(dto);
  }
  @Get('/admins')
  async getAdmins() {
    return this.accountService.getAdmins();
  }
  @Get('/me')
  async getMe(@CurrentUser() user: AccessTokenPayload) {
    return this.accountService.getMe(user);
  }
}

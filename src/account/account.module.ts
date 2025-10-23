import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';

@Module({
  controllers: [AccountController],
  exports: [AccountService],
  providers: [AccountService],
})
export class AccountModule {}

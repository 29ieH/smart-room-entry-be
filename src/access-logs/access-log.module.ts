import { Module } from '@nestjs/common';
import { AccessLogService } from './access-log.service';
import { AccessLogController } from './access-log.controller';
import { AccessLogGateway } from './access-log-gateway';
import { AccountModule } from 'src/account/account.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AccountModule, AuthModule],
  controllers: [AccessLogController],
  providers: [AccessLogService, AccessLogGateway],
  exports: [AccessLogService, AccessLogGateway],
})
export class AccessLogModule {}

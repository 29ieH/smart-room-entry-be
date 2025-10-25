import { Module } from '@nestjs/common';
import { PushNotifyController } from './push-notify.controller';
import { PushNotifyService } from './push-notify.service';

@Module({
  controllers: [PushNotifyController],
  providers: [PushNotifyService],
  exports: [PushNotifyService],
})
export class PushNotifyModule {}

import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AuthModule } from 'src/auth/auth.module';
import { NotificationController } from './notification.controlle';
import { NotificationPublisher } from './notification-publisher';
import { NotificationListener } from './notification-listener';
import { AccountModule } from 'src/account/account.module';
import { NotificationGateway } from './notification-gateway';
import { PushNotifyModule } from 'src/push-notify/push-notify.module';

@Module({
  imports: [AuthModule, AccountModule, PushNotifyModule],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationPublisher,
    NotificationListener,
    NotificationGateway,
  ],
  exports: [NotificationPublisher],
})
export class NotificationModule {}

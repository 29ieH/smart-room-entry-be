import { Module } from '@nestjs/common';
import { AccessCardController } from './access-card.controller';
import { AccessCardService } from './access-card.service';
import { HttpModule } from '@nestjs/axios';
import { NotificationModule } from 'src/notification/notification.module';
import { AccessLogModule } from 'src/access-logs/access-log.module';
import { RoomModule } from 'src/room/room.module';

@Module({
  imports: [
    HttpModule.register({}),
    NotificationModule,
    AccessLogModule,
    RoomModule,
  ],
  controllers: [AccessCardController],
  providers: [AccessCardService],
  exports: [AccessCardService],
})
export class AccessCardModule {}

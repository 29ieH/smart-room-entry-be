import { Module } from '@nestjs/common';
import { SensorController } from './sensor.controller';
import { SensorService } from './sensor.service';
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
  controllers: [SensorController],
  providers: [SensorService],
  exports: [],
})
export class SensorModule {}

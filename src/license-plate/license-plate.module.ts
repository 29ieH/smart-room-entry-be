import { Module } from '@nestjs/common';
import { LicensePlateController } from './license-plate.controller';
import { LicensePlateService } from './license-plate.service';
import { HttpModule } from '@nestjs/axios';
import { RoomModule } from 'src/room/room.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  controllers: [LicensePlateController],
  imports: [HttpModule.register({}), RoomModule, NotificationModule],
  providers: [LicensePlateService],
  exports: [LicensePlateService],
})
export class LicensePlateModule {}

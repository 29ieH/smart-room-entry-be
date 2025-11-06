import { Module } from '@nestjs/common';
import { LicensePlateController } from './license-plate.controller';
import { LicensePlateService } from './license-plate.service';
import { HttpModule } from '@nestjs/axios';
import { RoomModule } from 'src/room/room.module';
import { NotificationModule } from 'src/notification/notification.module';
import { AccountModule } from 'src/account/account.module';
import { LicensePlateGateway } from './license-plate-gateway';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [LicensePlateController],
  imports: [
    HttpModule.register({}),
    RoomModule,
    NotificationModule,
    AccountModule,
    AuthModule,
  ],
  providers: [LicensePlateService, LicensePlateGateway],
  exports: [LicensePlateService],
})
export class LicensePlateModule {}

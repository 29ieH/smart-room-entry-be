import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import configuration from 'configuration';
import { AccessCardModule } from './access-cards/access-card.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreModule } from './core/core.module';
import { PrismaModule } from './prisma/prisma.module';
import { SensorModule } from './sensors/sensor.module';
import { AuthModule } from './auth/auth.module';
import { AccountModule } from './account/account.module';
import { NotificationModule } from './notification/notification.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleConfigModule } from './schedule/scheduleConfig.module';
import { AccessLogModule } from './access-logs/access-log.module';
import { RoomModule } from './room/room.module';
import { AuthGuard } from './common/guards/auth.guard';
import { RoleGuard } from './common/guards/role.guard';
import { LicensePlateModule } from './license-plate/license-plate.module';
import { PushNotifyModule } from './push-notify/push-notify.module';
import { SettingModule } from './settings/setting.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `../.env`,
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule.registerAsync({
      useFactory: (configService: ConfigService) =>
        configService.get<string>('database.url', 'localdb'),
      inject: [ConfigService],
      isGlobal: true,
    }),
    EventEmitterModule.forRoot(),
    CoreModule,
    SensorModule,
    AccessCardModule,
    AuthModule,
    AccountModule,
    NotificationModule,
    ScheduleConfigModule,
    AccessLogModule,
    RoomModule,
    LicensePlateModule,
    PushNotifyModule,
    SettingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true,
      }),
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationModule } from 'src/notification/notification.module';
import { TaskService } from './task.service';
import { SettingModule } from 'src/settings/setting.module';

@Module({
  imports: [ScheduleModule.forRoot(), NotificationModule, SettingModule],
  providers: [TaskService],
})
export class ScheduleConfigModule {}

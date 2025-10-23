import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationModule } from 'src/notification/notification.module';
import { TaskService } from './task.service';

@Module({
  imports: [ScheduleModule.forRoot(), NotificationModule],
  providers: [TaskService],
})
export class ScheduleConfigModule {}

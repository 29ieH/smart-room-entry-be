import { Injectable, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { NOTIFI_OCCUPANCY_RESET } from 'src/common/constant/setting-key.constant';
import { NOTIFI_OCCUPANCY_RESET_DEFAULT } from 'src/common/constant/settings-value.constant';
import { CustomLogger } from 'src/core/logger.service';
import { NotificationPublisher } from 'src/notification/notification-publisher';
import { SettingService } from 'src/settings/setting.service';

@Injectable()
export class TaskService implements OnModuleInit {
  constructor(
    private readonly logger: CustomLogger,
    private readonly notificationPublisher: NotificationPublisher,
    private readonly settingService: SettingService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}
  async onModuleInit() {
    await this.addDynamicOccupancyResetJob();
  }
  // @Cron(CronExpression.EVERY_10_MINUTES)
  // handleOccupancyReset() {
  //   this.logger.log(
  //     `Check & notify reset occupancy in every 10 minutes - checkAt: ${new Date().toDateString()}`,
  //   );
  //   return this.notificationPublisher.publishRoomOccupancyVerificationSuggested();
  // }
  private async addDynamicOccupancyResetJob() {
    // Lấy phút từ setting
    const notifiOccupancyResetSetting =
      await this.settingService.getSettingByKey(NOTIFI_OCCUPANCY_RESET);
    const cronExp = `0 */${notifiOccupancyResetSetting?.value ?? NOTIFI_OCCUPANCY_RESET_DEFAULT} * * * *`;

    const job = new CronJob(cronExp, () => {
      this.logger.log(
        `Check & notify reset occupancy - checkAt: ${new Date().toISOString()}`,
      );
      this.notificationPublisher.publishRoomOccupancyVerificationSuggested();
      console.log('Send notify reset occupancy successfully');
    });
    // Thêm job vào scheduler registry để có thể quản lý (start/stop/remove)
    this.schedulerRegistry.addCronJob('dynamicOccupancyReset', job);
    job.start();
    this.logger.log(
      `Dynamic occupancy reset job added, every ${notifiOccupancyResetSetting?.value ?? NOTIFI_OCCUPANCY_RESET_DEFAULT} minutes`,
    );
  }
}

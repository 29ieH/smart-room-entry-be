import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CustomLogger } from 'src/core/logger.service';
import { NotificationPublisher } from 'src/notification/notification-publisher';

@Injectable()
export class TaskService {
  constructor(
    private readonly logger: CustomLogger,
    private readonly notificationPublisher: NotificationPublisher,
  ) {}
  @Cron(CronExpression.EVERY_10_MINUTES)
  handleOccupancyReset() {
    this.logger.log(
      `Check & notify reset occupancy in every 10 minutes - checkAt: ${new Date().toDateString()}`,
    );
    return this.notificationPublisher.publishRoomOccupancyVerificationSuggested();
  }
}

import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { UserNotificationFilterDto } from './dto/requests/user-notification-filter.dto';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}
  @Get('/me')
  async getMyNotification(@Query() filter: UserNotificationFilterDto) {
    return this.notificationService.getMyNotification(filter);
  }

  @Patch(':notifyId/read')
  async markAsRead(@Param('notifyId', ParseIntPipe) notifyId: number) {
    return this.notificationService.markAsRead(notifyId);
  }
  @Get('/unread-count')
  async countUnRead() {
    return this.notificationService.countUnRead();
  }
}

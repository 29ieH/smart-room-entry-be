import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserNotificationFilterDto } from './dto/requests/user-notification-filter.dto';
import { NotificationService } from './notification.service';
import { DeviceTokenRequestDto } from './dto/requests/device-token-request.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AccessTokenPayload } from 'src/auth/interfaces/access-token-payload';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}
  @Get('/me')
  async getMyNotification(
    @CurrentUser() user: AccessTokenPayload,
    @Query() filter: UserNotificationFilterDto,
  ) {
    return this.notificationService.getMyNotification(user, filter);
  }

  @Patch(':notifyId/read')
  async markAsRead(
    @Param('notifyId', ParseIntPipe) notifyId: number,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.notificationService.markAsRead(notifyId, user);
  }
  @Get('/unread-count')
  async countUnRead(@CurrentUser() user: AccessTokenPayload) {
    return this.notificationService.countUnRead(user);
  }
  @Post('/device-token')
  handleDeviceToken(@Body() dto: DeviceTokenRequestDto) {
    this.notificationService.handleDeviceToken(dto);
  }
}

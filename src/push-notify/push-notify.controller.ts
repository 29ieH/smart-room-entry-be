import { Body, Controller, Post } from '@nestjs/common';
import { PushNotifyService } from './push-notify.service';
import { PushSubscriptionDto } from './dto/request/push-subscription';
import { SendNotifyPayload } from './dto/request/send-notify-payload';
import { IsPublicRoute } from 'src/common/decorators/public-route.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AccessTokenPayload } from 'src/auth/interfaces/access-token-payload';
import { RoleName } from '@prisma/client';

@Controller('push-notify')
export class PushNotifyController {
  constructor(private readonly pushService: PushNotifyService) {}
  @Post('/subscribe')
  async subscribe(
    @CurrentUser() user: AccessTokenPayload,
    @Body() subscription: PushSubscriptionDto,
  ) {
    await this.pushService.handleSubscribe(user, subscription);
  }
  @IsPublicRoute()
  @Post('/send')
  async sendPush(@Body() dto: SendNotifyPayload) {
    const subscription = dto.subscription;
    const payload = dto.payload;
    await this.pushService.sendPush(subscription, payload);
  }
  @IsPublicRoute()
  @Post('/send-admins')
  async sendPushtoAdmins() {
    await this.pushService.sendPushToRole(RoleName.ADMIN, {
      title: 'test send push to admins',
      body: 'test send push to admins',
    });
  }
}

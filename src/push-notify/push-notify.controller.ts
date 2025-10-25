import { Body, Controller, Post } from '@nestjs/common';
import { PushNotifyService } from './push-notify.service';
import { PushSubscriptionDto } from './dto/request/push-subscription';
import { SendNotifyPayload } from './dto/request/send-notify-payload';
import { IsPublicRoute } from 'src/common/decorators/public-route.decorator';

@Controller('push-notify')
export class PushNotifyController {
  constructor(private readonly pushService: PushNotifyService) {}
  @IsPublicRoute()
  @Post('/subscribe')
  subscribe(@Body() subscription: PushSubscriptionDto) {
    this.pushService.handleSubscribe(subscription);
  }
  @IsPublicRoute()
  @Post('/send')
  async sendPush(@Body() dto: SendNotifyPayload) {
    const subscription = dto.subscription;
    const payload = dto.payload;
    await this.pushService.sendPush(subscription, payload);
  }
}

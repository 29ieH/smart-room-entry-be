import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PushSubscriptionDto } from './dto/request/push-subscription';
import { PushNotifyPayload } from './dto/request/push-notify-payload';
import { CustomLogger } from 'src/core/logger.service';

@Injectable()
export class PushNotifyService {
  constructor(
    private configService: ConfigService,
    private readonly logger: CustomLogger,
  ) {
    webpush.setVapidDetails(
      'https://29ieh.github.io/smart-room-entry-app',
      this.configService.get<string>('vapidKey.public', 'vapidkeyprivate'),
      this.configService.get<string>('vapidKey.private', 'vapidkeypublic'),
    );
  }

  async sendPush(
    subscription: PushSubscriptionDto,
    payload: PushNotifyPayload,
  ): Promise<boolean> {
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      return true;
    } catch (err) {
      this.logger.error(
        `Send push error ${(err as Error).name} !!!`,
        `Detail:: ${(err as Error).message}`,
      );
      return false;
    }
  }
  handleSubscribe(subscription: PushSubscriptionDto) {
    this.logger.log(
      `Subscribe by subscription:: ${JSON.stringify(subscription)}`,
    );
  }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PushSubscriptionDto } from './dto/request/push-subscription';
import { PushNotifyPayload } from './dto/request/push-notify-payload';
import { CustomLogger } from 'src/core/logger.service';
import { AccessTokenPayload } from 'src/auth/interfaces/access-token-payload';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  AccountStatus,
  Prisma,
  PushSubscription,
  RoleName,
} from '@prisma/client';
import { WebPushError } from './interfaces/web-push';

@Injectable()
export class PushNotifyService {
  constructor(
    private configService: ConfigService,
    private readonly logger: CustomLogger,
    private readonly prismaService: PrismaService,
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
  async sendPushToRole(roleName: RoleName, payload: PushNotifyPayload) {
    const subscriptions = await this.prismaService.pushSubscription.findMany({
      where: {
        account: {
          role: {
            roleName: roleName,
          },
        },
        status: AccountStatus.ACTIVE,
      },
    });
    await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            this.toSubscriptionDto(subscription),
            JSON.stringify(payload),
          );
        } catch (err: unknown) {
          const e = err as WebPushError;
          console.error(`Push failed for subscription ${subscription.id}`, err);
          // Nếu endpoint không còn hợp lệ → deactivate
          if (e.statusCode === 410 || e.statusCode === 404) {
            await this.prismaService.pushSubscription.update({
              where: { id: subscription.id },
              data: { status: AccountStatus.INACTIVE },
            });
            this.logger.log(` Subscription ${subscription.id} set to DEACTIVE`);
          }
        }
      }),
    );
  }

  async handleSubscribe(
    currentUser: AccessTokenPayload,
    subscription: PushSubscriptionDto,
  ) {
    const userById = await this.prismaService.account.findUnique({
      where: { id: currentUser.sub },
    });
    if (!userById) {
      this.logger.error(
        `Subscribe by subscription:: User not found by sub:: ${currentUser.sub}`,
      );
      return;
    }
    const subscriptionExistByClient =
      await this.prismaService.pushSubscription.findUnique({
        where: {
          endpoint: subscription.endpoint,
        },
      });
    if (subscriptionExistByClient) {
      this.logger.log(
        `Subscribe by subscription client exist !!! ${subscription.endpoint}`,
      );
      return;
    }
    const subscriptionData: Prisma.PushSubscriptionCreateInput = {
      account: {
        connect: {
          id: userById.id,
        },
      },
      auth: subscription.keys.auth,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
    };
    const pushSubscriptionCreated =
      await this.prismaService.pushSubscription.create({
        data: subscriptionData,
      });
    this.logger.log(
      `Save subscriptions by client id ${currentUser.sub} - data:: ${JSON.stringify(pushSubscriptionCreated)}`,
    );
  }
  private toSubscriptionDto(
    subscription: PushSubscription,
  ): PushSubscriptionDto {
    return {
      keys: {
        auth: subscription.auth,
        p256dh: subscription.p256dh,
      },
      expirationTime: null,
      endpoint: subscription.endpoint,
    };
  }
}

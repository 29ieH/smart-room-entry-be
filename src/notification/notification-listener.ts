import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationType, RoleName } from '@prisma/client';
import { AccountService } from 'src/account/account.service';
import { AccountSummaryResponse } from 'src/account/dto/response/account-creation.response';
import { NotificationEvent } from 'src/common/enum/notification-event.enum';
import { NotificationTitle } from 'src/common/enum/notification-title.enum';
import { CustomLogger } from 'src/core/logger.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationLicensePlatePayload } from './dto/payloads/notification-license-plate';
import { NotificationUnlockPayload } from './dto/payloads/notification-unlock-payload';
import { NotificationSummaryResponse } from './dto/responses/notification-summary.response.dto';
import { NotificationService } from './notification.service';
import { PushNotifyService } from 'src/push-notify/push-notify.service';
import { PushNotifyPayload } from 'src/push-notify/dto/request/push-notify-payload';

@Injectable()
export class NotificationListener {
  private bellowMinOccupany: number;
  private aboveMaxOccupany: number;
  constructor(
    private readonly accountService: AccountService,
    private readonly notificationService: NotificationService,
    private readonly logger: CustomLogger,
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly pushNotifyService: PushNotifyService,
  ) {
    this.bellowMinOccupany = this.configService.get<number>(
      'notification.config.bellowMinOccupany',
      -10,
    );
    this.aboveMaxOccupany = this.configService.get<number>(
      'notification.config.aboveMaxOccupany',
      20,
    );
  }
  @OnEvent(NotificationEvent.ROOM_CAPACITY_EXCEEDED)
  async handleRoomCapacityExceeded(payload: NotificationUnlockPayload) {
    const title = this.convertEventToNotificationTilte(
      NotificationEvent.ROOM_CAPACITY_EXCEEDED,
    );
    await this.sendNotificationToAdmins(
      title,
      NotificationType.SECURITY,
      payload.content,
    );
    await this.pushSubscriptionToAdmins(title, payload.content);
  }
  @OnEvent(NotificationEvent.FREQUENT_GATE_ACCESS_FOR_OTHERS)
  async handleFrequentGateAccessForOthers(payload: NotificationUnlockPayload) {
    const title = this.convertEventToNotificationTilte(
      NotificationEvent.FREQUENT_GATE_ACCESS_FOR_OTHERS,
    );
    await this.sendNotificationToAdmins(
      title,
      NotificationType.SECURITY,
      payload.content,
    );
  }
  @OnEvent(NotificationEvent.UNAUTHORIZED_ACCESS)
  async handleUnauthorizedAccess(payload: NotificationUnlockPayload) {
    const title = this.convertEventToNotificationTilte(
      NotificationEvent.UNAUTHORIZED_ACCESS,
    );
    await this.sendNotificationToAdmins(
      title,
      NotificationType.SECURITY,
      payload.content,
    );
    await this.pushSubscriptionToAdmins(title, payload.content);
  }
  @OnEvent(NotificationEvent.ROOM_OCCUPANCY_VERIFICATION_SUGGESTED)
  async handleRoomOccupancyVerificationSuggested() {
    const roomsExceedingThresold = await this.prismaService.room.findMany({
      where: {
        OR: [
          {
            currentPeople: {
              gte: this.aboveMaxOccupany,
            },
          },
          {
            currentPeople: {
              lte: this.bellowMinOccupany,
            },
          },
        ],
      },
    });
    if (roomsExceedingThresold.length > 0) {
      const title = this.convertEventToNotificationTilte(
        NotificationEvent.ROOM_OCCUPANCY_VERIFICATION_SUGGESTED,
      );
      console.log('roomsExceedingThresold', roomsExceedingThresold);
      const type = NotificationType.ALERT;
      await Promise.all(
        roomsExceedingThresold.map(async (room) => {
          const message = `Vui lòng cập nhật lại số người trong phòng, hiện tại phòng ${room.id} có ${room.currentPeople} người — có vẻ không chính xác.`;
          await this.sendNotificationToAdmins(title, type, message);
          await this.pushSubscriptionToAdmins(title, message);
        }),
      );
    }
  }
  @OnEvent(NotificationEvent.VEHICLE_UNAUTHORIZED_ACCESS)
  async handleVehicleLicensePlateUnregistered(
    payload: NotificationLicensePlatePayload,
  ) {
    const title = this.convertEventToNotificationTilte(
      NotificationEvent.VEHICLE_UNAUTHORIZED_ACCESS,
    );
    await this.sendNotificationToAdmins(
      title,
      NotificationType.SECURITY,
      payload.content,
    );
    await this.pushSubscriptionToAdmins(title, payload.content);
  }

  private async sendNotificationToAdmins(
    title: string,
    type: NotificationType,
    content: string,
  ) {
    try {
      const accountAdmins = await this.accountService.getAdmins();
      if (accountAdmins.length > 0) {
        const accountAdminIds = accountAdmins.map(
          (admin: AccountSummaryResponse) => admin.id,
        );
        const notifications: NotificationSummaryResponse | null =
          await this.notificationService.create({
            title,
            message: content,
            receiverIds: accountAdminIds,
            type: type,
          });
        if (notifications) {
          this.notificationService.sendNotification(notifications.notifi);
        }
      }
    } catch (error) {
      this.logger.error(
        `sendNotificationToAdmins failed`,
        (error as Error).message,
      );
    }
  }
  private async pushSubscriptionToAdmins(title: string, message: string) {
    try {
      const payload: PushNotifyPayload = {
        title,
        body: message,
      };
      await this.pushNotifyService.sendPushToRole(RoleName.ADMIN, payload);
    } catch (error) {
      this.logger.error(
        `pushSubscriptionToAdmins failed`,
        (error as Error).message,
      );
    }
  }
  private convertEventToNotificationTilte(event: NotificationEvent) {
    switch (event) {
      case NotificationEvent.ROOM_CAPACITY_EXCEEDED:
        return NotificationTitle.ROOM_CAPACITY_EXCEEDED;
      case NotificationEvent.GATE_LEFT_OPEN:
        return NotificationTitle.GATE_LEFT_OPEN;
      case NotificationEvent.FREQUENT_GATE_ACCESS_FOR_OTHERS:
        return NotificationTitle.FREQUENT_GATE_ACCESS_FOR_OTHERS;
      case NotificationEvent.ROOM_OCCUPANCY_VERIFICATION_SUGGESTED:
        return NotificationTitle.ROOM_OCCUPANCY_UPDATE_SUGGESTED;
      case NotificationEvent.UNAUTHORIZED_ACCESS:
        return NotificationTitle.UNAUTHORIZED_ACCESS;
      case NotificationEvent.VEHICLE_UNAUTHORIZED_ACCESS:
        return NotificationTitle.VEHICLE_UNAUTHORIZED_ACCESS;
      default:
        return NotificationTitle.SECURITY_TITLE_DEFAULT;
    }
  }
}

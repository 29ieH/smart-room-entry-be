import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AccountNotification, Notification, Prisma } from '@prisma/client';
import { SortDirection } from 'src/common/enum/query.enum';
import { getPaginationData } from 'src/common/helpers/paginate.helper';
import { PaginationResult } from 'src/common/types/paginate-type';
import { CustomLogger } from 'src/core/logger.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { DeviceTokenRequestDto } from './dto/requests/device-token-request.dto';
import { NotificationCreationRequestDto } from './dto/requests/notification-creation-request.dto';
import { UserNotificationFilterDto } from './dto/requests/user-notification-filter.dto';
import { NotificationAccountSummary } from './dto/responses/notification-account-summary';
import {
  NotificationSummary,
  NotificationSummaryResponse,
} from './dto/responses/notification-summary.response.dto';
import { NotificationGateway } from './notification-gateway';
import { AccessTokenPayload } from 'src/auth/interfaces/access-token-payload';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly notificationGateway: NotificationGateway,
    private readonly logger: CustomLogger,
  ) {}

  async create(
    dto: NotificationCreationRequestDto,
  ): Promise<NotificationSummaryResponse | null> {
    const now = new Date();
    const receivers = await this.prismaService.account.findMany({
      where: {
        id: { in: dto.receiverIds },
      },
    });
    if (receivers.length === 0) {
      this.logger.log(
        `No receiver found for notification type ${dto.type} at ${now.toLocaleString()}`,
      );
      return null;
    }
    const notificationData: Prisma.NotificationCreateInput = {
      title: dto.title,
      content: dto.message,
      type: dto.type,
      sentAt: new Date(),
    };
    try {
      const notificationCreated = await this.prismaService.notification.create({
        data: notificationData,
      });
      await this.prismaService.accountNotification.createMany({
        data: receivers.map((receiver) => ({
          accountId: receiver.id,
          notificationId: notificationCreated.id,
        })),
      });
      const notifyAccountCreated =
        await this.prismaService.accountNotification.findMany({
          where: {
            notificationId: notificationCreated.id,
          },
          include: { notification: true },
        });
      this.logger.log(
        `Notification created sucessfully`,
        `Body:: ${JSON.stringify(notifyAccountCreated)}`,
      );
      const response: NotificationSummaryResponse = {
        notifi: notifyAccountCreated.map((notify) =>
          this.buildNotificationAccountSummary(notify),
        ),
        createdAt: notificationCreated.sentAt,
      };
      return response;
    } catch (error) {
      this.logger.error(`Create notification error`, (error as Error).message);
      throw new InternalServerErrorException('Internal server errror');
    }
  }
  async getMyNotification(
    user: AccessTokenPayload,
    filter: UserNotificationFilterDto,
  ): Promise<PaginationResult<NotificationAccountSummary>> {
    const { page, pageSize } = filter;
    const userDetail = await this.prismaService.account.findUnique({
      where: {
        id: user.sub,
      },
    });
    if (!userDetail) throw new BadRequestException('Vui lòng đăng nhập');
    const direction = SortDirection.DESC;
    const notificationsCount =
      await this.prismaService.accountNotification.count({
        where: {
          accountId: userDetail.id,
        },
      });
    const paginationData = getPaginationData(
      notificationsCount,
      page,
      pageSize,
    );
    const notifications = await this.prismaService.accountNotification.findMany(
      {
        where: {
          accountId: userDetail.id,
        },
        orderBy: {
          notification: {
            sentAt: direction,
          },
        },
        skip: paginationData.skip,
        take: pageSize,
        include: {
          notification: true,
        },
      },
    );
    const response: PaginationResult<NotificationAccountSummary> = {
      meta: {
        totalItems: notificationsCount,
        totalPages: paginationData.totalPages,
        currentPage: paginationData.safePage,
        itemsPerPage: pageSize,
        itemCount: notifications.length,
      },
      data: notifications.map((notify) =>
        this.buildNotificationAccountSummary(notify),
      ),
    };
    return response;
  }
  async markAsRead(
    notifyId: number,
    user: AccessTokenPayload,
  ): Promise<NotificationAccountSummary> {
    const userDetail = await this.prismaService.account.findUnique({
      where: {
        id: user.sub,
      },
    });
    if (!userDetail) throw new UnauthorizedException('Vui lòng đăng nhập');
    const notificationById =
      await this.prismaService.accountNotification.findUnique({
        where: {
          id: notifyId,
        },
        include: {
          notification: true,
        },
      });
    if (!notificationById)
      throw new NotFoundException('Không tìm thấy thông báo');
    if (notificationById.accountId !== userDetail.id)
      throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
    if (notificationById.isRead === true)
      return this.buildNotificationAccountSummary(notificationById);
    try {
      const notificationUpdated =
        await this.prismaService.accountNotification.update({
          where: {
            id: notificationById.id,
          },
          data: {
            isRead: true,
          },
          include: {
            notification: true,
          },
        });
      return this.buildNotificationAccountSummary(notificationUpdated);
    } catch (error) {
      this.logger.error(`Mark as read error`, (error as Error).message);
      throw new InternalServerErrorException('Internal server errror');
    }
  }
  async countUnRead(user: AccessTokenPayload): Promise<number> {
    const userDetail = await this.prismaService.account.findUnique({
      where: {
        id: user.sub,
      },
    });
    if (!userDetail) throw new UnauthorizedException('Vui lòng đăng nhập');
    const notificationsUnRead =
      await this.prismaService.accountNotification.findMany({
        where: {
          accountId: userDetail.id,
          isRead: false,
        },
      });
    return notificationsUnRead.length;
  }
  handleDeviceToken(dto: DeviceTokenRequestDto) {
    this.logger.log(`Handle device token`, `Body:: ${JSON.stringify(dto)}`);
  }
  // Gửi
  sendNotification(notifications: NotificationAccountSummary[]) {
    notifications.forEach((notify) => {
      this.notificationGateway.sendNotification(notify.accountId, notify);
    });
  }

  private buildNotificationSummaryResponse(
    data: Notification,
  ): NotificationSummary {
    return {
      id: data.id,
      title: data.title,
      type: data.type,
      message: data.content,
      sentAt: data.sentAt,
    };
  }
  private buildNotificationAccountSummary(
    data: AccountNotification & { notification: Notification },
  ): NotificationAccountSummary {
    return {
      id: data.id,
      accountId: data.accountId,
      notificationId: data.notification.id,
      isRead: data.isRead,
      content: data.notification.content,
      title: data.notification.title,
      sentAt: data.notification.sentAt,
      type: data.notification.type,
    };
  }
}

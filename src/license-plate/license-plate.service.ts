import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  entryDirection,
  EventUnlockStatus,
  Prisma,
  Room,
  VehicleEntryLog,
  VehicleRoomStatus,
  VehicleStatus,
} from '@prisma/client';
import {
  UNKNOWN_BRAND,
  UNKNOWN_CHASSIS_NUMBER,
  UNKNOWN_COLOR,
  UNKNOWN_PLATE_LICENSE,
} from 'src/common/constant/vehicle-data.constant';
import { LockStatus } from 'src/common/enum/unlock-event.enum';
import { parseRoomNumberByKey } from 'src/common/utils/parse-unlock-event';
import { getStatusLock } from 'src/common/utils/ttlock.util';
import { CustomLogger } from 'src/core/logger.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoomService } from 'src/room/room.service';
import { LicensePlateInfoRequest } from './dto/license-plate-info.request';
import { NotificationPublisher } from 'src/notification/notification-publisher';
import { NotificationLicensePlatePayload } from 'src/notification/dto/payloads/notification-license-plate';
import { GetAllLicensePlateRequest } from './dto/get-all-license-plate.request';
import { getPaginationData } from 'src/common/helpers/paginate.helper';
import { SortDirection } from 'src/common/enum/query.enum';
import { VehicleEntryLogSummary } from './dto/vehicle-entry-log-summary';
import { PaginationResult } from 'src/common/types/paginate-type';

@Injectable()
export class LicensePlateService {
  constructor(
    private logger: CustomLogger,
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly roomService: RoomService,
    private readonly notificationPublisher: NotificationPublisher,
  ) {}
  async handleLicensePlate(dto: LicensePlateInfoRequest): Promise<void> {
    this.logger.debug(`Received license plate info: ${JSON.stringify(dto)}`);
    const historyInfo: Partial<Prisma.VehicleEntryLogCreateInput> = {};
    historyInfo.direction = entryDirection.IN;
    const timeStamp = Number(dto.timeStamp);
    historyInfo.logDate = new Date(timeStamp);
    console.log('Timestampt:: ', timeStamp);
    let notificationContent: string = '';
    console.log('Date:: ', new Date(timeStamp).toUTCString());
    try {
      const licensePlateVehicle =
        await this.prismaService.vehicleLicensePlate.findFirst({
          where: {
            licensePlateNumber: dto.licensePlate,
          },
          include: {
            vehicle: true,
            RoomVehicleLicensePlate: {
              include: {
                room: true,
              },
            },
          },
        });
      const timeWindow = 180 * 1000;
      // Map event unlock
      console.log('Check log event rcent !!!');
      const logEventLockRecent =
        await this.prismaService.logEventUnlock.findFirst({
          where: {
            status: EventUnlockStatus.PENDING,
            lockDate: {
              gte: BigInt(timeStamp - timeWindow),
              lte: BigInt(timeStamp + timeWindow),
            },
          },
        });
      if (!logEventLockRecent) {
        console.log('NOT EVENT LOG RECENT');
        const lastWindowLockTime = timeStamp - 60 * 1000;
        const lockStatusRecent = await getStatusLock(
          lastWindowLockTime,
          this.logger,
          this.configService,
          this.httpService,
        );
        console.log('This status recent:: ', lockStatusRecent);
        if (
          lockStatusRecent &&
          lockStatusRecent.state === Number(LockStatus.UNLOCK)
        ) {
          console.log('Find unlock recent gaanf nhat');
          // Cửa không khoá
          const unlockEventRecent =
            await this.prismaService.logEventUnlock.findFirst({
              where: {
                lockDate: {
                  lt: timeStamp,
                },
              },
              orderBy: {
                lockDate: 'desc',
              },
              take: 1,
            });

          if (unlockEventRecent) {
            console.log('NO EVENT UNLOCK - UNLOCK RÊCENT');
            const roomNumber = parseRoomNumberByKey(unlockEventRecent.userName);
            if (!roomNumber) {
              this.logger.log(
                `Không nhận diện được room number từ event unlock mã #${unlockEventRecent.keyboardPwd} - userName #${unlockEventRecent.userName} - lockAt::${unlockEventRecent.lockDate}`,
              );
              return;
            }
            const roomByRoomNumber =
              await this.roomService.getRoomByCodeNumber(roomNumber);
            if (!roomByRoomNumber) {
              this.logger.log(
                `Không nhận diện được phòng từ event unlock mã #${unlockEventRecent.keyboardPwd} - userName #${unlockEventRecent.userName} - lockAt::${unlockEventRecent.lockDate}`,
              );
              return;
            }
            // Lưu log history
            historyInfo.room = {
              connect: { id: roomByRoomNumber.id },
            };
            historyInfo.note =
              (historyInfo.note ?? '') +
              `Xe truy cập vào nhà trọ không cần mở khoá cửa (Phòng ${roomByRoomNumber.roomNumber} không khoá cửa) - `;
            notificationContent =
              (notificationContent ?? '') +
              `Phòng ${roomByRoomNumber.roomNumber} không khoá cửa khi xe truy cập vào nhà trọ - `;
          } else {
            console.log('NO EVENT UNLOCK - NO UNLOCK RÊCENT');
            this.logger.log(
              `Không tìm thấy event unlock trước thời điểm ${new Date(
                timeStamp,
              ).toLocaleDateString()}`,
            );
            historyInfo.room = {
              connect: { id: 1 },
            };
          }
        }
      } else {
        console.log('EVENT LOCK RECENT');
        const roomNumber = parseRoomNumberByKey(logEventLockRecent.userName);
        if (!roomNumber) {
          this.logger.log(
            `Không nhận diện được room number từ event unlock mã #${logEventLockRecent.keyboardPwd} - userName #${logEventLockRecent.userName} - lockAt::${logEventLockRecent.lockDate}`,
          );
          return;
        }
        const roomByRoomNumber =
          await this.roomService.getRoomByCodeNumber(roomNumber);
        if (!roomByRoomNumber) {
          this.logger.log(
            `Không nhận diện được phòng từ event unlock mã #${logEventLockRecent.keyboardPwd} - userName #${logEventLockRecent.userName} - lockAt::${logEventLockRecent.lockDate}`,
          );
          return;
        }
        // Lưu log history
        historyInfo.room = {
          connect: { id: roomByRoomNumber.id },
        };
        historyInfo.note =
          (historyInfo.note ?? '') +
          `Xe thuộc Phòng ${roomByRoomNumber.roomNumber} vừa truy cập vào nhà trọ - `;
      }
      if (!licensePlateVehicle) {
        console.log('Room license plate vehicle non:: ', historyInfo.room);
        this.logger.log(
          `License plate ${dto.licensePlate} not found in the system.`,
        );
        notificationContent =
          (notificationContent ?? '') +
          `Xe truy cập với biển số ${dto.licensePlate} chưa được đăng ký trong hệ thống`;
        historyInfo.brand = UNKNOWN_BRAND;
        historyInfo.color = UNKNOWN_COLOR;
        historyInfo.chassisNumber = UNKNOWN_CHASSIS_NUMBER;
        historyInfo.licensePlateNumber =
          dto.licensePlate === UNKNOWN_PLATE_LICENSE
            ? UNKNOWN_PLATE_LICENSE
            : dto.licensePlate;
        historyInfo.note =
          (historyInfo.note ?? '') +
          'Biển số xe chưa được đăng ký trong hệ thống.';
        const vehicleEntryLog = await this.prismaService.vehicleEntryLog.create(
          {
            data: historyInfo as Prisma.VehicleEntryLogCreateInput,
          },
        );
        this.logger.log(
          `Created vehicle entry log with ID: ${vehicleEntryLog.id} at ${new Date().toLocaleDateString()} for unregistered license plate.`,
        );
        return;
      } else {
        historyInfo.brand = licensePlateVehicle.vehicle.brand;
        historyInfo.color = licensePlateVehicle.vehicle.color;
        historyInfo.chassisNumber = licensePlateVehicle.vehicle.chassisNumber;
        historyInfo.licensePlateNumber = licensePlateVehicle.licensePlateNumber;
        // Check vehicle status
        if (
          licensePlateVehicle.status ===
          VehicleRoomStatus.BLACKLISTED.toString()
        ) {
          this.logger.log(
            `Vehicle with license plate ${dto.licensePlate} is blacklisted. Access denied.`,
          );
          historyInfo.note =
            (historyInfo.note ?? '') +
            'Xe truy cập đang nằm trong danh sách đen';
          notificationContent =
            (notificationContent ?? '') +
            `Xe truy cập với biển số ${dto.licensePlate} đang nằm trong danh sách hạn chế.`;
        } else if (
          licensePlateVehicle.vehicle.status === VehicleStatus.STOLEN.toString()
        ) {
          this.logger.log(
            `Vehicle with license plate ${dto.licensePlate} is reported as stolen. Access denied.`,
          );
          historyInfo.note =
            (historyInfo.note ?? '') + 'Xe truy cập đang được báo đã mất cắp';
          notificationContent =
            (notificationContent ?? '') +
            `Xe truy cập với biển số ${dto.licensePlate} đã được báo mất cắp.`;
        } else {
          historyInfo.note = historyInfo.note ?? '';
        }
        const vehicleEntryLog = await this.prismaService.vehicleEntryLog.create(
          {
            data: historyInfo as Prisma.VehicleEntryLogCreateInput,
          },
        );
        this.logger.log(
          `Created vehicle entry log with ID: ${vehicleEntryLog.id} at ${new Date().toLocaleDateString()} for license plate ${dto.licensePlate}.`,
        );
      }
      if (!notificationContent) {
        const notificationPayload: NotificationLicensePlatePayload = {
          content: notificationContent,
        };
        this.notificationPublisher.publishUnauthorizedVehicleAccess(
          notificationPayload,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error handling license plate info: ${(error as Error).message}`,
      );
    }
  }
  async getAllLicensePlate(
    filter: GetAllLicensePlateRequest,
  ): Promise<PaginationResult<VehicleEntryLogSummary>> {
    const { page, pageSize } = filter;
    const whereOptions = this.buildQueryFilterLicensePlate(filter);
    const licensePlatesCount = await this.prismaService.vehicleEntryLog.count({
      where: whereOptions,
    });
    const paginationData = getPaginationData(
      licensePlatesCount,
      page,
      pageSize,
    );

    const licensePlates = await this.prismaService.vehicleEntryLog.findMany({
      where: whereOptions,
      include: {
        room: true,
      },
      orderBy: [
        {
          logDate: SortDirection.DESC,
        },
        {
          id: SortDirection.DESC,
        },
      ],
      skip: paginationData.skip,
      take: pageSize,
    });

    const response: PaginationResult<VehicleEntryLogSummary> = {
      data: licensePlates.map((licensePlate) =>
        this.toLicensePlateSummary(licensePlate),
      ),
      meta: {
        currentPage: paginationData.safePage,
        totalItems: paginationData.totalItems,
        totalPages: paginationData.totalPages,
        itemsPerPage: paginationData.safePageSize,
        itemCount: licensePlates.length,
      },
    };
    return response;
  }
  private buildQueryFilterLicensePlate(filter: GetAllLicensePlateRequest) {
    return {
      AND: [
        ...this.buildRangeDateQuery(filter.startDate, filter.endDate),
        ...(filter.search
          ? [
              {
                OR: [
                  {
                    room: {
                      roomNumber: {
                        contains: filter.search,
                      },
                    },
                  },
                  {
                    licensePlateNumber: {
                      contains: filter.search,
                    },
                  },
                  {
                    brand: {
                      contains: filter.search,
                    },
                  },
                ],
              },
            ]
          : []),
      ],
    };
  }
  private buildRangeDateQuery(startDate?: Date, endDate?: Date) {
    if (!startDate && !endDate) return [];
    const condition = {
      logDate: {} as Record<string, Date>,
    };
    if (startDate) condition.logDate.gte = new Date(startDate);
    if (endDate) condition.logDate.lte = new Date(endDate);
    return [condition];
  }

  private toLicensePlateSummary(
    data: VehicleEntryLog & { room: Room },
  ): VehicleEntryLogSummary {
    return {
      id: data.id,
      roomNumber: data.room.roomNumber,
      licensePlateNumber: data.licensePlateNumber,
      brand: data.brand,
      chassisNumber: data.chassisNumber,
      color: data.color,
      note: data.note ?? '',
      logDate: data.logDate,
    };
  }
}

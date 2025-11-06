import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventUnlockStatus, LogSensorStatus, Prisma } from '@prisma/client';
import { firstValueFrom } from 'rxjs';
import { AccessLogService } from 'src/access-logs/access-log.service';
import { AccessLogSummaryResponse } from 'src/access-logs/dto/response/acess-log-summary.response';
import {
  NOTE_EXPECT_PENDIGN_SENSOR,
  NOTE_EXPECT_UNCONFIRMED_SENSOR,
} from 'src/common/constant/message-note.constant';
import {
  DEBOUNCE_EVENT_UNLOCK_TTL,
  PENDING_UNLOCK_EVENT_TTL,
  UNCONFIRMED_UNLOCK_EVENT_TTL,
} from 'src/common/constant/unlock-event.constant';
import {
  UnlockEventType,
  UnlockRecordStatus,
  UnlockRecordType,
} from 'src/common/enum/unlock-event.enum';
import {
  parseRecordTypeToUnlockMethod,
  parseRoomNumberByKey,
} from 'src/common/utils/parse-unlock-event';
import { CustomLogger } from 'src/core/logger.service';
import { NotificationUnlockPayload } from 'src/notification/dto/payloads/notification-unlock-payload';
import { NotificationPublisher } from 'src/notification/notification-publisher';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoomService } from 'src/room/room.service';
import { LockStatusResponse } from 'src/sensors/dto/response/lock-status.response';
import {
  UnlockEventRecord,
  UnlockEventRequest,
} from './dto/unlock-event.request';

@Injectable()
export class AccessCardService {
  private cloudClientId: string;
  private cloudAcessToken: string;
  private cloudLockId: string;
  private ttlockBaseUrl: string;
  private twUnconfirmed: number;
  private twPending: number;
  constructor(
    private readonly logger: CustomLogger,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly prismaService: PrismaService,
    private readonly notificationPublisher: NotificationPublisher,
    private readonly accessLogService: AccessLogService,
    private readonly roomService: RoomService,
  ) {
    this.cloudClientId = this.configService.get<string>(
      'ttlockCloud.clientId',
      'CLIENT_DEFAULT',
    );
    this.cloudAcessToken = this.configService.get<string>(
      'ttlockCloud.accessToken',
      'ACCESS_TOKEN_DEFAULT',
    );
    this.cloudLockId = this.configService.get<string>(
      'ttlockCloud.lockId',
      'LOCK_ID_DEFAULT',
    );
    this.ttlockBaseUrl = this.configService.get<string>(
      'ttlockCloud.baseUrl',
      'baseURLDefault',
    );
    this.twUnconfirmed = Number(
      this.configService.get<string>(
        'ttl.unconfirmed',
        UNCONFIRMED_UNLOCK_EVENT_TTL.toString(),
      ),
    );
    this.twPending = Number(
      this.configService.get<string>(
        'ttl.pending',
        PENDING_UNLOCK_EVENT_TTL.toString(),
      ),
    );
  }
  async handleUnlockEvent(dto: UnlockEventRequest) {
    console.log('Unlock event:: ', JSON.stringify(dto));
    if (dto.notifyType === UnlockEventType.UNLOCK.toString()) {
      const records = JSON.parse(dto.records) as Array<UnlockEventRecord>;
      const recordUnlock = records[0];
      console.log(
        'unlock timestamp vn:: ',
        new Date(recordUnlock.lockDate).toUTCString(),
      );
      if (
        recordUnlock.success.toString() === UnlockRecordStatus.FAILED.toString()
      ) {
        this.logger.log(
          `Unlock event by lockId ${recordUnlock.keyboardPwd} failed - lockAt::${recordUnlock.lockDate}`,
        );
        return;
      }
      if (
        recordUnlock.recordType.toString() ===
          UnlockRecordType.ACCESS_CARD_UNLOCK.toString() ||
        recordUnlock.recordType.toString() ===
          UnlockRecordType.FINGERPRINT_VERIFICATION_UNLOCK.toString() ||
        recordUnlock.recordType.toString() ===
          UnlockRecordType.PASSWORD_UNLOCK.toString()
      ) {
        const unlockId = recordUnlock.keyboardPwd;
        const debounceWindow = DEBOUNCE_EVENT_UNLOCK_TTL * 1000;
        const debounceKey = await this.prismaService.logEventUnlock.findFirst({
          where: {
            keyboardPwd: unlockId,
            userName: recordUnlock.username,
            lockDate: {
              gte: Number(recordUnlock.lockDate) - debounceWindow, // có event xảy ra trong 5s gần đây
              lt: Number(recordUnlock.lockDate),
            },
            status: EventUnlockStatus.PENDING,
          },
        });
        if (debounceKey) {
          this.logger.log(
            `Duplicate event unlock by key::  ${unlockId} at timestampt:: ${debounceKey.lockDate}`,
          );
          return;
        } else {
          const unConfirmedWindowTime = this.twUnconfirmed * 60 * 1000;
          const pendingWindowTime = this.twPending * 1000;
          let status: EventUnlockStatus = EventUnlockStatus.PENDING;
          try {
            // Lấy ra room của lock hiện tại
            let currentPeople = 0;
            const logSensorIds: number[] = [];
            let note: string = '';
            let peopleIn = 0;
            let peopleOut = 0;
            const roomNumber = parseRoomNumberByKey(recordUnlock.username);
            console.log('Room number:: ', roomNumber);
            if (!roomNumber) {
              this.logger.log(
                `Không nhận diện được room number từ event unlock mã #${recordUnlock.keyboardPwd} - userName #${recordUnlock.username} - lockAt::${recordUnlock.lockDate}`,
              );
              return;
            }
            const roomByRoomNumber =
              await this.roomService.getRoomByCodeNumber(roomNumber);
            if (!roomByRoomNumber) {
              this.logger.log(
                `Không nhận diện được phòng từ event unlock mã #${recordUnlock.keyboardPwd} - userName #${recordUnlock.username} - lockAt::${recordUnlock.lockDate}`,
              );
              return;
            }
            const logSensorUnconfirmd =
              await this.prismaService.logSensor.findMany({
                where: {
                  status: LogSensorStatus.UNCONFIRMED,
                  lastTimestamp: {
                    gte: recordUnlock.lockDate - unConfirmedWindowTime,
                    lte: recordUnlock.lockDate,
                  },
                },
              });
            if (logSensorUnconfirmd.length > 0) {
              // Tính tổng current people từ outCount và inCount
              logSensorUnconfirmd.forEach((logSensor) => {
                peopleIn += logSensor.inCount;
                peopleOut += logSensor.outCount;
                currentPeople += logSensor.inCount - logSensor.outCount;
                logSensorIds.push(logSensor.id);
              });
              this.logger.log(
                `Current people by sensor unconfirmed:: ${currentPeople}`,
              );
              note += NOTE_EXPECT_UNCONFIRMED_SENSOR;
            }
            const logSensorPending =
              await this.prismaService.logSensor.findMany({
                where: {
                  status: LogSensorStatus.PENDING,
                  lastTimestamp: {
                    gte: recordUnlock.lockDate - pendingWindowTime,
                    lte: recordUnlock.lockDate + pendingWindowTime,
                  },
                },
              });
            if (logSensorPending.length > 0) {
              // Tính tổng current people từ outCount và inCount
              logSensorPending.forEach((logSensor) => {
                peopleIn += logSensor.inCount;
                peopleOut += logSensor.outCount;
                currentPeople += logSensor.inCount - logSensor.outCount;
                logSensorIds.push(logSensor.id);
              });
              this.logger.log(
                `Current people by sensor pending:: ${currentPeople}`,
              );
              note += '&' + NOTE_EXPECT_PENDIGN_SENSOR;
            }
            if (currentPeople > 0 || currentPeople < 0) {
              status = EventUnlockStatus.CONFIRMED;
              // update current people
              await this.prismaService.logSensor.updateMany({
                where: {
                  id: {
                    in: logSensorIds,
                  },
                },
                data: {
                  status: LogSensorStatus.CONFIRMED,
                },
              });
              const roomUpdated = await this.prismaService.room.update({
                where: {
                  id: roomByRoomNumber.id,
                },
                data: {
                  currentPeople: {
                    increment: currentPeople,
                  },
                },
              });
              await this.roomService.sendUpdateCurrentTenant(roomUpdated);
              const accessLogCreated =
                await this.prismaService.accessLog.create({
                  data: {
                    roomId: roomUpdated.id,
                    userName: recordUnlock.username,
                    inCount: peopleIn,
                    outCount: peopleOut,
                    logDate: new Date(recordUnlock.lockDate),
                    unlockMethod: parseRecordTypeToUnlockMethod(
                      Number(recordUnlock.recordType),
                    ),
                    note,
                  },
                });
              this.logger.log(
                `Update current people roomId #${roomUpdated.id} to ${roomUpdated.currentPeople} by lockNumber #${recordUnlock.keyboardPwd} - lockAt::${recordUnlock.lockDate}`,
              );
              this.logger.log(
                `Access log created:: ${JSON.stringify(accessLogCreated)} at lockNumber #${recordUnlock.keyboardPwd} - lockAt::${recordUnlock.lockDate}`,
              );
              const accessLogSummaryPayload: AccessLogSummaryResponse = {
                id: accessLogCreated.id,
                roomNumber: roomUpdated.roomNumber,
                inCount: peopleIn,
                outCount: peopleOut,
                userName: accessLogCreated.userName,
                note: accessLogCreated.note ?? '',
                logDate: accessLogCreated.logDate,
                unlockMethod: accessLogCreated.unlockMethod,
              };
              await this.accessLogService.sendNewLog(accessLogSummaryPayload);
              if (roomUpdated.currentPeople > roomUpdated.capacity) {
                this.logger.log('Room capacity exceeded - sendNotifiy');
                const payload: NotificationUnlockPayload = {
                  content: `Số người hiện tại của phòng ${roomUpdated.id} là ${roomUpdated.currentPeople} vượt quá số người quy định là ${roomUpdated.capacity}`,
                };
                this.notificationPublisher.publishRoomCapacityExceeded(payload);
              } else if (roomUpdated.currentPeople < 0) {
                const payload: NotificationUnlockPayload = {
                  content: `Có vẻ phòng ${roomUpdated.id} thường xuyên không đóng cửa/hoặc mở cửa cho người khác vào cùng`,
                };
                this.notificationPublisher.publishFrequentGateAccessForOthers(
                  payload,
                );
              }
            }
            const eventLockPayload: Prisma.LogEventUnlockCreateInput = {
              keyboardPwd: recordUnlock.keyboardPwd,
              lockDate: recordUnlock.lockDate,
              userName: recordUnlock.username,
              success: recordUnlock.success,
              recordType: Number(recordUnlock.recordType),
              serverDate: recordUnlock.serverDate,
              createdDate: new Date(),
              status: status,
            };
            // ADD UNLOCK EVENT
            const logEventLockCreated =
              await this.prismaService.logEventUnlock.create({
                data: eventLockPayload,
              }); // this.logger.log(`Event lock created:: ${logEventLockCreated}`)
            console.log('Event lock created:: ', logEventLockCreated);
          } catch (error) {
            this.logger.error(
              `Hanlde event unlock error:: ${(error as Error).message}`,
            );
          }
        }
      }
    }
  }

  async getStatusLock(timestamp: number): Promise<LockStatusResponse | null> {
    try {
      const params = new URLSearchParams();
      params.append('clientId', this.cloudClientId);
      params.append('accessToken', this.cloudAcessToken);
      params.append('lockId', this.cloudLockId);
      params.append('date', timestamp.toString());
      const options = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      };
      const response = await firstValueFrom(
        this.httpService.post<LockStatusResponse>(
          `${this.ttlockBaseUrl}/lock/queryOpenState`,
          params,
          options,
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        'Get status lock failed at ${timestamp}',
        (error as Error).message,
      );
      return null;
    }
  }
}

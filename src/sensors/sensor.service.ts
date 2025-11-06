import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventUnlockStatus, LogSensorStatus } from '@prisma/client';
import { firstValueFrom } from 'rxjs';
import { UnlockHistoryResponse } from 'src/access-cards/dto/response/unlock-history.response';
import { AccessLogService } from 'src/access-logs/access-log.service';
import { AccessLogSummaryResponse } from 'src/access-logs/dto/response/acess-log-summary.response';
import {
  NOTE_EXPECT_NO_UNLOCK,
  NOTE_EXPECT_PENDIGN_SENSOR,
  NOTE_NO_UNLOCK,
  NOTE_UNCONFIRMED_SENSOR,
} from 'src/common/constant/message-note.constant';
import { LockStatus } from 'src/common/enum/unlock-event.enum';
import {
  parseRecordTypeToUnlockMethod,
  parseRoomNumberByKey,
} from 'src/common/utils/parse-unlock-event';
import { CustomLogger } from 'src/core/logger.service';
import { NotificationUnlockPayload } from 'src/notification/dto/payloads/notification-unlock-payload';
import { NotificationPublisher } from 'src/notification/notification-publisher';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoomService } from 'src/room/room.service';
import { LockStatusResponse } from './dto/response/lock-status.response';
import { SensorPayload } from './dto/sensor-payload';
import { UnlockHistoryOptions } from './interfaces/unlock-history.interface';

@Injectable()
export class SensorService {
  private cloudClientId: string;
  private cloudAcessToken: string;
  private cloudLockId: string;
  private ttlockBaseUrl: string;
  private twPendingSensorEntry: number;
  private twCheckLockBeforeEntry: number;
  private twCheckLockAfterEntry: number;
  private ttlAI: number;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly logger: CustomLogger,
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
    this.twPendingSensorEntry = Number(
      this.configService.get<string>('ttl.PENDING_SENSOR_ENTRY_TTL', '50'),
    );
    this.twCheckLockBeforeEntry = Number(
      this.configService.get<string>(
        'ttl.CHECK_BEFORE_LOCK_SENSOR_ENTRY_TTL',
        '10',
      ),
    );
    this.twCheckLockAfterEntry = Number(
      this.configService.get<string>('ttl.checkLockAfterEntrySensor', '10'),
    );
    this.ttlAI = Number(this.configService.get<string>('ttl.ttlAI', '1'));
  }

  async handleSensorEvent(payload: SensorPayload) {
    payload.lastTimestamp = payload.lastTimestamp * this.ttlAI;
    console.log(
      'sensor timestamp vn:: ',
      new Date(payload.lastTimestamp).toUTCString(),
    );
    const timeWindow = 50 * 1000;
    let note: string = '';
    let logSensorStatus: LogSensorStatus = LogSensorStatus.PENDING;
    const logEventLockRecent =
      await this.prismaService.logEventUnlock.findFirst({
        where: {
          status: EventUnlockStatus.PENDING,
          lockDate: {
            gte: Number(payload.lastTimestamp) - timeWindow,
            lte: Number(payload.lastTimestamp) + timeWindow,
          },
        },
      });
    if (!logEventLockRecent) {
      this.logger.log('LOG SENSOR - NO EVENT LOCK RECENT');
      // Check trạng thái cửa trước khi lastTimestampt
      const lastWindowLockTime = payload.lastTimestamp - 10 * 1000;
      const lockStatusRecent = await this.getStatusLock(lastWindowLockTime);
      console.log(
        'Timesampt current:: ',
        new Date(lastWindowLockTime).toUTCString(),
      );
      console.log('Lock status recent:: ', lockStatusRecent);
      if (
        lockStatusRecent &&
        lockStatusRecent.state === Number(LockStatus.UNLOCK)
      ) {
        this.logger.log('LOG SENSOR - UNLOCK FOR RECENT EVNET LOCK');
        note = NOTE_NO_UNLOCK;
        const unlockEventRecent =
          await this.prismaService.logEventUnlock.findFirst({
            where: {
              lockDate: {
                lt: payload.lastTimestamp,
              },
            },
            orderBy: {
              lockDate: 'desc',
            },
            take: 1,
          });
        if (unlockEventRecent) {
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
          const currentPeople = payload.inCount - payload.outCount;
          await this.updateCurrentPeopleAndSendNotify(
            roomByRoomNumber.id,
            currentPeople,
          );
          logSensorStatus = LogSensorStatus.CONFIRMED;
          const acessLogNote = NOTE_EXPECT_NO_UNLOCK.replace(
            '{}',
            roomByRoomNumber.roomNumber,
          );
          const notificationUnlockPayload: NotificationUnlockPayload = {
            content: `Phòng ${roomByRoomNumber.roomNumber} ra/vào nhà trọ không thực hiện đóng cửa`,
          };
          this.notificationPublisher.publishGateLeftOpen(
            notificationUnlockPayload,
          );
          const accessLogCreated = await this.prismaService.accessLog.create({
            data: {
              inCount: payload.inCount,
              outCount: payload.outCount,
              roomId: roomByRoomNumber.id,
              userName: unlockEventRecent.userName,
              logDate: new Date(Number(payload.lastTimestamp)),
              unlockMethod: parseRecordTypeToUnlockMethod(
                unlockEventRecent.recordType,
              ),
              note: acessLogNote,
            },
          });
          this.logger.log(
            `Access log created:: ${JSON.stringify(accessLogCreated)} at lockNumber #${unlockEventRecent.keyboardPwd} - lockAt::${unlockEventRecent.lockDate}`,
          );
          const accessLogSummaryPayload: AccessLogSummaryResponse = {
            id: accessLogCreated.id,
            roomNumber: roomByRoomNumber.roomNumber,
            userName: accessLogCreated.userName,
            inCount: accessLogCreated.inCount,
            outCount: accessLogCreated.outCount,
            note: accessLogCreated.note ?? '',
            unlockMethod: accessLogCreated.unlockMethod,
            logDate: accessLogCreated.logDate,
          };
          await this.accessLogService.sendNewLog(accessLogSummaryPayload);
        }
      } else if (
        lockStatusRecent &&
        lockStatusRecent.state === Number(LockStatus.LOCK)
      ) {
        this.logger.log('LOG SENSOR - CHECK LÃN VÃN');
        const unlockHistoryWindowTime = payload.lastTimestamp + 10 * 1000;
        // Check xem sau 10s có ra ngoài k
        const unlockHistory = await this.getHistoryUnlock(Date.now(), {
          startDate: unlockHistoryWindowTime,
        });
        if (unlockHistory && unlockHistory.total === 0) {
          logSensorStatus = LogSensorStatus.UNCONFIRMED;
          note = NOTE_UNCONFIRMED_SENSOR;
        } else if (unlockHistory && unlockHistory.total > 0) {
          logSensorStatus = LogSensorStatus.PENDING;
        }
      }
    } else {
      this.logger.log('LOG SENSOR - FIND EVENT LOCK RECENT');
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
      const currentPeople = payload.inCount - payload.outCount;
      await this.updateCurrentPeopleAndSendNotify(
        roomByRoomNumber.id,
        currentPeople,
      );
      await this.prismaService.logEventUnlock.update({
        where: {
          id: logEventLockRecent.id,
        },
        data: {
          status: EventUnlockStatus.CONFIRMED,
        },
      });
      this.logger.log(
        `Update current people ${roomByRoomNumber.roomNumber} successfully - update event TTLOCK [CONFIRMED]`,
      );
      const accessLogCreated = await this.prismaService.accessLog.create({
        data: {
          inCount: payload.inCount,
          outCount: payload.outCount,
          roomId: roomByRoomNumber.id,
          userName: logEventLockRecent.userName,
          logDate: new Date(Number(payload.lastTimestamp)),
          unlockMethod: parseRecordTypeToUnlockMethod(
            logEventLockRecent.recordType,
          ),
          note: NOTE_EXPECT_PENDIGN_SENSOR,
        },
      });
      this.logger.log(
        `Access log created:: ${JSON.stringify(accessLogCreated)} at lockNumber #${logEventLockRecent.keyboardPwd} - lockAt::${logEventLockRecent.lockDate}`,
      );
      const accessLogSummaryPayload: AccessLogSummaryResponse = {
        id: accessLogCreated.id,
        roomNumber: roomByRoomNumber.roomNumber,
        userName: accessLogCreated.userName,
        inCount: accessLogCreated.inCount,
        outCount: accessLogCreated.outCount,
        note: accessLogCreated.note ?? '',
        logDate: accessLogCreated.logDate,
        unlockMethod: accessLogCreated.unlockMethod,
      };
      await this.accessLogService.sendNewLog(accessLogSummaryPayload);
      logSensorStatus = LogSensorStatus.CONFIRMED;
    }
    const sensorLog = await this.prismaService.logSensor.create({
      data: {
        inCount: payload.inCount,
        outCount: payload.outCount,
        lastTimestamp: payload.lastTimestamp,
        receivedDate: new Date(),
        status: logSensorStatus,
        note: note,
      },
    });
    console.log('Sensor log created successfully !!!', sensorLog);
  }
  async getHistoryUnlock(
    currentDate: number,
    unlockOptions: UnlockHistoryOptions,
  ): Promise<UnlockHistoryResponse | null> {
    try {
      const params = new URLSearchParams();
      params.append('clientId', this.cloudClientId);
      params.append('accessToken', this.cloudAcessToken);
      params.append('lockId', this.cloudLockId);
      params.append('date', currentDate.toString());
      params.append('pageNo', '1');
      params.append('pageSize', '1');
      if (unlockOptions.startDate) {
        params.append('startDate', unlockOptions.startDate.toString());
      }
      if (unlockOptions.endDate) {
        params.append('endDate', unlockOptions.endDate.toString());
      }
      const options = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      };
      const response = await firstValueFrom(
        this.httpService.post<UnlockHistoryResponse>(
          `${this.ttlockBaseUrl}/lockRecord/list`,
          params,
          options,
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        'Get history unlock failed at ${currentDate}',
        (error as Error).message,
      );
      return null;
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
      this.logger.log(`Base url:: ${this.ttlockBaseUrl}/lock/queryOpenState`);
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
  async updateCurrentPeopleAndSendNotify(
    accessCardRoomId: number,
    currentPeople: number,
  ) {
    const roomUpdated = await this.prismaService.room.update({
      where: {
        id: accessCardRoomId,
      },
      data: {
        currentPeople: {
          increment: currentPeople,
        },
      },
    });
    await this.roomService.sendUpdateCurrentTenant(roomUpdated);
    if (roomUpdated.currentPeople > roomUpdated.capacity) {
      const payload: NotificationUnlockPayload = {
        content: `Số người hiện tại của phòng ${roomUpdated.id} là ${roomUpdated.currentPeople} vượt quá số người quy định là ${roomUpdated.capacity}`,
      };

      this.notificationPublisher.publishRoomCapacityExceeded(payload);
    } else if (roomUpdated.currentPeople < 0) {
      const payload: NotificationUnlockPayload = {
        content: `Có vẻ phòng ${roomUpdated.id} thường xuyên không đóng cửa/hoặc mở cửa cho người khác vào cùng`,
      };
      this.notificationPublisher.publishFrequentGateAccessForOthers(payload);
    }
  }
}

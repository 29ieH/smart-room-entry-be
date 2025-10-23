import { Injectable } from '@nestjs/common';
import { AccessLog, Room } from '@prisma/client';
import { AccountService } from 'src/account/account.service';
import { AccountSummaryResponse } from 'src/account/dto/response/account-creation.response';
import { SortDirection } from 'src/common/enum/query.enum';
import { getPaginationData } from 'src/common/helpers/paginate.helper';
import { PaginationResult } from 'src/common/types/paginate-type';
import { CustomLogger } from 'src/core/logger.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AccessLogGateway } from './access-log-gateway';
import { LogFilterRequest } from './dto/request/log-filter.request';
import { AccessLogSummaryResponse } from './dto/response/acess-log-summary.response';

@Injectable()
export class AccessLogService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly accountService: AccountService,
    private readonly accessLogGateway: AccessLogGateway,
    private readonly logger: CustomLogger,
  ) {}
  async getLogs(
    filter: LogFilterRequest,
  ): Promise<PaginationResult<AccessLogSummaryResponse>> {
    const { page, pageSize } = filter;
    const whereOptions = this.buildQueryFilterLogs(filter);
    const AccessLogsCount = await this.prismaService.accessLog.count({
      where: whereOptions,
    });
    const paginationData = getPaginationData(AccessLogsCount, page, pageSize);

    const logs = await this.prismaService.accessLog.findMany({
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
    const response: PaginationResult<AccessLogSummaryResponse> = {
      data: logs.map((accessLog) => this.buildAccessLogSummary(accessLog)),
      meta: {
        currentPage: paginationData.safePage,
        totalItems: paginationData.totalItems,
        itemCount: logs.length,
        itemsPerPage: pageSize,
        totalPages: paginationData.totalPages,
      },
    };
    return response;
  }
  async sendNewLog(payload: AccessLogSummaryResponse) {
    this.logger.log(`Send new access log history to admins`);
    const admins: AccountSummaryResponse[] =
      await this.accountService.getAdmins();
    if (admins.length > 0) {
      const adminIds = admins.map((admin) => admin.id);
      adminIds.forEach((adminId) => {
        this.accessLogGateway.sendNewLog(adminId, payload);
      });
    }
  }
  private buildAccessLogSummary(
    data: AccessLog & {
      room: Room;
    },
  ): AccessLogSummaryResponse {
    return {
      id: data.id,
      roomNumber: data.room.roomNumber,
      userName: data.userName,
      inCount: data.inCount,
      outCount: data.outCount,
      note: data.note ?? '',
      unlockMethod: data.unlockMethod,
      logDate: data.logDate,
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
  private buildQueryFilterLogs(filter: LogFilterRequest) {
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
                    userName: {
                      contains: filter.search,
                    },
                  },
                ],
              },
            ]
          : []),
        ...(filter.unlockType
          ? [
              {
                unlockMethod: filter.unlockType,
              },
            ]
          : []),
      ],
    };
  }
}

import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AccessLogService } from './access-log.service';
import { LogFilterRequest } from './dto/request/log-filter.request';

@Controller('access-logs')
export class AccessLogController {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly accessLogService: AccessLogService,
  ) {}
  @Get()
  async getLogs(@Query() filter: LogFilterRequest) {
    return this.accessLogService.getLogs(filter);
  }
}

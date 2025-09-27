import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PRISMA_MODULE_CONFIG } from './prisma.module-definition';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
  constructor(
    @Inject(PRISMA_MODULE_CONFIG)
    private readonly databaseUrl: string,
  ) {
    super({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
  }
}

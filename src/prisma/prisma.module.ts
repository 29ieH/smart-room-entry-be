import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaModuleClass } from './prisma.module-definition';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule extends PrismaModuleClass {}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule.registerAsync({
      useFactory: (configService: ConfigService) =>
        configService.get<string>('database.url', 'localdb'),
      inject: [ConfigService],
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

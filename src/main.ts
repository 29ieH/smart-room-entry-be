import { INestApplicationContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as cookieParser from 'cookie-parser';
import { Server, ServerOptions } from 'https';
import { AppModule } from './app.module';
class CustomIoAdapter extends IoAdapter {
  constructor(
    private readonly configService: ConfigService,
    app: INestApplicationContext,
  ) {
    super(app);
  }
  createIOServer(port: number, options?: ServerOptions) {
    const origins = this.configService.get<string[]>('cors.origins') || [
      'http://localhost:5500',
    ];
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: origins,
        credentials: true,
      },
    }) as Server;
    console.log('✅ WebSocket CORS origins:', origins);
    return server;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  const configService = app.get(ConfigService);
  const origins = configService.get<string[]>('cors.origins', []);
  console.log('Origins:: ', origins);
  app.enableCors({
    origin: origins,
    credentials: true,
  });
  app.useWebSocketAdapter(new CustomIoAdapter(configService, app));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

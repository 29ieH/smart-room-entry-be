import { Module } from '@nestjs/common';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { AuthModule } from 'src/auth/auth.module';
import { AccountModule } from 'src/account/account.module';
import { roomGateway } from './room-gateway';

@Module({
  controllers: [RoomController],
  exports: [RoomService],
  providers: [RoomService, roomGateway],
  imports: [AuthModule, AccountModule],
})
export class RoomModule {}

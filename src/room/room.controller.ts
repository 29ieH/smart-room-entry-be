import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { RoomFilterRequest } from './dto/request/room-filter.request';
import { RoomService } from './room.service';
import { RoomUpdateRequest } from './dto/request/room-update.request';
import { GetPageRequest } from './dto/request/get-page.request';

@Controller('/rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}
  @Get('/')
  async getRooms(@Query() filter: RoomFilterRequest) {
    return this.roomService.getRooms(filter);
  }
  @Patch('/:roomId')
  async updateRoom(
    @Param('roomId') roomId: number,
    @Body() dto: RoomUpdateRequest,
  ) {
    return this.roomService.updateRoom(Number(roomId), dto);
  }
  @Get('/find-pages')
  async getPageByRoomId(@Query() getPageRequest: GetPageRequest) {
    return this.roomService.getPageByRoomId(getPageRequest);
  }
}

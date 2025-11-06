import { Injectable, NotFoundException } from '@nestjs/common';
import { Room } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoomSummaryResponse } from './dto/response/room-summary.response';
import { PaginationResult } from 'src/common/types/paginate-type';
import { RoomFilterRequest } from './dto/request/room-filter.request';
import { getPaginationData } from 'src/common/helpers/paginate.helper';
import { SortDirection } from 'src/common/enum/query.enum';
import { RoomUpdateRequest } from './dto/request/room-update.request';
import { AccountService } from 'src/account/account.service';
import { CustomLogger } from 'src/core/logger.service';
import { AccountSummaryResponse } from 'src/account/dto/response/account-creation.response';
import { roomGateway } from './room-gateway';
import { GetPageRequest } from './dto/request/get-page.request';
import { GetPageResponse } from './dto/response/get-page.response';

@Injectable()
export class RoomService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly accountService: AccountService,
    private readonly logger: CustomLogger,
    private readonly roomGateway: roomGateway,
  ) {}
  async getRoomByCodeNumber(
    codeNumber: string,
  ): Promise<RoomSummaryResponse | null> {
    const roomFinded = await this.prismaService.room.findUnique({
      where: {
        roomNumber: codeNumber.toUpperCase(),
      },
    });
    if (!roomFinded) return null;
    return this.buildRoomSummaryResponse(roomFinded);
  }
  async sendUpdateCurrentTenant(roomUpdated: Room) {
    this.logger.log(`Send new access log history to admins`);
    const admins: AccountSummaryResponse[] =
      await this.accountService.getAdmins();
    if (!roomUpdated) {
      this.logger.log(`Room updated not found`);
      return;
    }
    const payload = this.buildRoomSummaryResponse(roomUpdated);
    if (admins.length > 0) {
      const adminIds = admins.map((admin) => admin.id);
      adminIds.forEach((adminId) => {
        this.roomGateway.sendNewLog(adminId, payload);
      });
    }
  }
  async getRooms(
    filter: RoomFilterRequest,
  ): Promise<PaginationResult<RoomSummaryResponse>> {
    const { page, pageSize } = filter;
    const roomsCount = await this.prismaService.room.count({
      where: {
        roomNumber: {
          contains: filter.search,
        },
      },
    });
    const paginationData = getPaginationData(roomsCount, page, pageSize);
    const rooms = await this.prismaService.room.findMany({
      where: {
        roomNumber: {
          contains: filter.search,
        },
      },
      orderBy: {
        roomNumber: SortDirection.ASC,
      },
      skip: paginationData.skip,
      take: pageSize,
    });
    const response: PaginationResult<RoomSummaryResponse> = {
      data: rooms.map((room) => this.buildRoomSummaryResponse(room)),
      meta: {
        currentPage: paginationData.safePage,
        totalItems: paginationData.totalItems,
        totalPages: paginationData.totalPages,
        itemCount: rooms.length,
        itemsPerPage: pageSize,
      },
    };
    return response;
  }
  async updateRoom(
    roomId: number,
    dto: RoomUpdateRequest,
  ): Promise<RoomSummaryResponse> {
    const roomById = await this.prismaService.room.findUnique({
      where: {
        id: roomId,
      },
    });
    if (!roomById) throw new NotFoundException('Không tìm thấy phòng');
    if (Object.keys(dto).length === 0)
      return this.buildRoomSummaryResponse(roomById);
    const roomUpdated = await this.prismaService.room.update({
      where: {
        id: roomId,
      },
      data: dto,
    });
    return this.buildRoomSummaryResponse(roomUpdated);
  }
  async getPageByRoomId(
    getPageRequest: GetPageRequest,
  ): Promise<GetPageResponse | null> {
    const targetRoom = await this.prismaService.room.findUnique({
      where: { id: getPageRequest.roomId },
      select: { roomNumber: true },
    });
    if (!targetRoom) {
      this.logger.error(
        `Không tìm thấy phòng với id:: ${getPageRequest.roomId}`,
      );
      return null;
    }
    const countBefore = await this.prismaService.room.count({
      where: { roomNumber: { lt: targetRoom.roomNumber } },
    });
    const page = Math.floor(countBefore / getPageRequest.pageSize) + 1;
    return {
      roomId: getPageRequest.roomId,
      page,
    };
  }
  private buildRoomSummaryResponse(data: Room): RoomSummaryResponse {
    return {
      id: data.id,
      roomNumber: data.roomNumber,
      capacity: data.capacity,
      currentPeople: data.currentPeople,
      status: data.status,
    };
  }
}

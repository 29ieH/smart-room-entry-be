import { RoomStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class RoomUpdateRequest {
  @IsOptional()
  @IsString({ message: 'roomNumber must be a string' })
  roomNumber?: string;
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'capacity must be an integer' })
  capacity?: number;
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'capacity must be an integer' })
  currentPeople?: number;
  @IsOptional()
  @Transform(({ value }) => String(value).replace(' ', '_').toUpperCase())
  @IsEnum(RoomStatus, { message: 'status must be a valid room status' })
  status: RoomStatus;
}

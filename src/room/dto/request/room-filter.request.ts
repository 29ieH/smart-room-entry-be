import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class RoomFilterRequest {
  @IsOptional()
  @IsString({ message: 'search must be a string' })
  search: string;
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'page must be an integer' })
  page: number = 1;
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'pageSize must be an integer' })
  pageSize: number = 10;
}

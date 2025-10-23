import { Transform, Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { UnlockMethod } from 'src/common/enum/unlock-event.enum';

export class LogFilterRequest {
  @IsOptional()
  @IsString({ message: 'search must be a string' })
  search: string;
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'startDate must be a date' })
  startDate: Date;
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'endDate must be a date' })
  endDate: Date;
  @IsOptional()
  @IsEnum(UnlockMethod, { message: 'unlockType must be a valid unlock type' })
  @Transform(({ value }) => String(value).replace(' ', '_').toUpperCase())
  unlockType: UnlockMethod;
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'page must be an integer' })
  page: number = 1;
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'pageSize must be an integer' })
  pageSize: number = 10;
}

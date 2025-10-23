import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class UserNotificationFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: 'Page must be an integer',
  })
  @Min(1, {
    message: 'Page must be at least 1',
  })
  page: number = 1;
  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: 'Page size must be an integer',
  })
  @Min(1, {
    message: 'Page size must be at least 1',
  })
  pageSize: number = 10;
}

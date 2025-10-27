import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, IsString } from 'class-validator';

export class GetAllLicensePlateRequest {
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
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'page must be an integer' })
  page: number = 1;
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'pageSize must be an integer' })
  pageSize: number = 10;
}

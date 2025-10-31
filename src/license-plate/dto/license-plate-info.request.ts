import { IsString, IsNumber, IsEnum } from 'class-validator';
import { VehicleType } from '../enum/vehicle.enum';
import { Transform } from 'class-transformer';

export class LicensePlateInfoRequest {
  @IsString({ message: 'licensePlate phải là chuỗi' })
  licensePlate: string;

  @IsNumber({}, { message: 'timeStamp phải là số' })
  timeStamp: number;
  @Transform(({ value }) => String(value).replace(/\s+/g, '').toUpperCase())
  @IsEnum(VehicleType, {
    message: 'vehicleType phải là một giá trị hợp lệ của VehicleType',
  })
  vehicleType: VehicleType;
}

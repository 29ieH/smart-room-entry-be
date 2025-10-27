import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';

export class SettingKey {
  @IsString()
  @IsNotEmpty({ message: 'Key không được để trống' })
  key: string;

  @IsString()
  @IsNotEmpty({ message: 'Value không được để trống' })
  value: string;
}

export class UpdateSettingRequestDto {
  @IsArray({ message: 'Settings phải là một mảng' })
  @ArrayNotEmpty({ message: 'Danh sách settings không được rỗng' })
  @ValidateNested({ each: true })
  @Type(() => SettingKey)
  settings: SettingKey[];
}

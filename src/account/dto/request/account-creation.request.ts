import { RoleName } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AccountCreationRequest {
  @IsNotEmpty({
    message: 'name is required',
  })
  @IsString({
    message: 'name must be a string',
  })
  name: string;
  @IsNotEmpty({
    message: 'userName is required',
  })
  @IsString({
    message: 'userName must be a string',
  })
  userName: string;
  @IsNotEmpty({
    message: 'password is required',
  })
  @IsString({
    message: 'password must be a string',
  })
  @MinLength(6, {
    message: 'password must be at least 6 characters',
  })
  password: string;
  @IsNotEmpty({ message: 'role is required' })
  @Transform(({ value }) => String(value).replace(/\s+/g, '').toUpperCase())
  @IsEnum(RoleName, { message: 'role must be a valid role' })
  role: RoleName;
}

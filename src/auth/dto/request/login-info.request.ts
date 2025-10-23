import { IsNotEmpty, IsString } from 'class-validator';

export class LoginInfoRequest {
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
  password: string;
}

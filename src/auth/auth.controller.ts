import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginInfoRequest } from './dto/request/login-info.request';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { IsPublicRoute } from 'src/common/decorators/public-route.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}
  @IsPublicRoute()
  @Post('/login')
  async login(@Body() dto: LoginInfoRequest, @Res() res: Response) {
    const result = await this.authService.login(dto);
    console.log('Token:: ', result.token);
    res.cookie('accessToken', result.token, {
      httpOnly: true,
      maxAge:
        this.configService.get<number>('cookie.accessTokenTTL', 3600) * 1000,
      sameSite: 'none',
      secure: false,
    });
    return res.send({
      success: true,
      data: {
        ...result,
      },
    });
  }
}

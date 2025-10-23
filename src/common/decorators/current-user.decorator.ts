import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AccessTokenPayload } from 'src/auth/interfaces/access-token-payload';

export const CurrentUser = createParamDecorator(
  (data: keyof AccessTokenPayload, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request['user'] as AccessTokenPayload;
    return data ? user?.[data] : user;
  },
);

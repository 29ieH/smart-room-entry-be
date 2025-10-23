import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PUBLIC_ROUTE_KEY } from '../decorators/public-route.decorator';

export function isPublicRoute(
  reflector: Reflector,
  context: ExecutionContext,
): boolean {
  try {
    return reflector.getAllAndOverride(PUBLIC_ROUTE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return false;
  }
}

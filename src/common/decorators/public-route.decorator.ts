import { SetMetadata } from '@nestjs/common';

export const PUBLIC_ROUTE_KEY = 'is_public_route';
export const IsPublicRoute = () => SetMetadata(PUBLIC_ROUTE_KEY, true);

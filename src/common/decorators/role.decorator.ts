import { SetMetadata } from '@nestjs/common';
import { RoleName } from '@prisma/client';

export const HAS_ROLE_KEY = 'has_role_key';
export const HasRole = (...roles: RoleName[]) =>
  SetMetadata(HAS_ROLE_KEY, roles);

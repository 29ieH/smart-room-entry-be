import { Request } from 'express';

export function extractTokenFromHeader(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (!authHeader) return undefined;
  const [type, token] = authHeader.split(' ') ?? [];
  if (type !== 'Bearer' || !token) return undefined;
  return token;
}
export function extractTokenFromSocket(
  extraHeader: string | undefined,
): string | undefined {
  if (!extraHeader) return undefined;
  const [type, token] = extraHeader.split(' ') ?? [];
  if (type !== 'Bearer' || !token) return undefined;
  return token;
}

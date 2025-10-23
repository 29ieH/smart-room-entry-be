import { InternalServerErrorException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CustomLogger } from 'src/core/logger.service';
export async function hashPassword(
  rawPassword: string,
  logger: CustomLogger,
): Promise<string> {
  try {
    return await bcrypt.hash(rawPassword, 10);
  } catch (error) {
    logger.error(
      `Hash password error`,
      `Caused by:: ${(error as Error).message}`,
    );
    throw new InternalServerErrorException('Internal server errror');
  }
}
export async function comparePassword(
  rawPassowrd: string,
  hashedPassword: string,
  logger: CustomLogger,
): Promise<boolean> {
  try {
    return await bcrypt.compare(rawPassowrd, hashedPassword);
  } catch (error) {
    logger.error(
      `Compare password error`,
      `Caused by:: ${(error as Error).message}`,
    );
    throw new InternalServerErrorException('Internal server errror');
  }
}

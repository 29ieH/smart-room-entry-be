import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { CustomLogger } from 'src/core/logger.service';
import { LockStatusResponse } from 'src/sensors/dto/response/lock-status.response';

export async function getStatusLock(
  timestamp: number,
  logger: CustomLogger,
  configService: ConfigService,
  httpService: HttpService,
): Promise<LockStatusResponse | null> {
  const cloudClientId = configService.get<string>(
    'ttlockCloud.clientId',
    'CLIENT_DEFAULT',
  );
  const cloudAcessToken = configService.get<string>(
    'ttlockCloud.accessToken',
    'ACCESS_TOKEN_DEFAULT',
  );
  const cloudLockId = configService.get<string>(
    'ttlockCloud.lockId',
    'LOCK_ID_DEFAULT',
  );
  const ttlockBaseUrl = configService.get<string>(
    'ttlockCloud.baseUrl',
    'baseURLDefault',
  );
  try {
    const params = new URLSearchParams();
    params.append('clientId', cloudClientId);
    params.append('accessToken', cloudAcessToken);
    params.append('lockId', cloudLockId);
    params.append('date', timestamp.toString());
    const options = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };
    const response = await firstValueFrom(
      httpService.post<LockStatusResponse>(
        `${ttlockBaseUrl}/lock/queryOpenState`,
        params,
        options,
      ),
    );
    return response.data;
  } catch (error) {
    logger.error(
      'Get status lock failed at ${timestamp}',
      (error as Error).message,
    );
    return null;
  }
}

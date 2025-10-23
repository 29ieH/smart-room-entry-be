import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { DEFAULT_CACHE_TTL_1H } from 'src/common/constant/redis.constant';
import { CustomLogger } from './logger.service';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private redis: Redis;
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: CustomLogger,
  ) {
    this.redis = new Redis({
      host: this.configService.get('redis.host', 'localhost'),
      port: this.configService.get('redis.port'),
      lazyConnect: true,
      keepAlive: 30000,
      connectTimeout: 10000,
      commandTimeout: 10000,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      enableOfflineQueue: true,
    });

    this.redis.on('connect', () => {
      this.logger.log('Redis connection established');
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error:', error.message);
    });

    this.redis.on('close', () => {
      this.logger.warn('Redis connection closed');
    });
  }
  onModuleDestroy() {
    throw new Error('Method not implemented.');
  }

  async setKey<T>(key: string, data: T, ttl?: number): Promise<boolean> {
    try {
      const cacheTTLInSeconds = ttl || DEFAULT_CACHE_TTL_1H;

      if (!key) {
        throw new Error('Cache key must not be empty');
      }

      if (data === undefined || data === null) {
        this.logger.warn(`Attempting to cache empty value for key: ${key}`);
      }

      const serializedData = JSON.stringify(data);
      await this.redis.setex(key, cacheTTLInSeconds, serializedData);
      this.logger.debug(
        `Cached Set data for key: ${key} with TTL: ${cacheTTLInSeconds}s`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Redis set error for key ${key}:`,
        (error as Error).message,
      );
      return false;
    }
  }
  async getKey<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) {
        this.logger.log(`No value found for key: ${key}`);
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      const msg = (error as Error).message;
      this.logger.error(`getKey failed for key=${key}`, msg);
      return null;
    }
  }

  async delKey(key: string): Promise<boolean> {
    try {
      const result = await this.redis.del(key);
      return result > 0;
    } catch (error) {
      this.logger.error(
        `delKey failed for key=${key}`,
        (error as Error).message,
      );
      return false;
    }
  }

  async incrBy(key: string, delta: number): Promise<number | null> {
    try {
      return await this.redis.incrby(key, delta);
    } catch (error) {
      this.logger.error(
        `incrBy failed for key=${key}`,
        (error as Error).message,
      );
      return null;
    }
  }

  async decrBy(key: string, delta: number): Promise<number | null> {
    try {
      return await this.redis.decrby(key, delta);
    } catch (error) {
      this.logger.error(
        `decrBy failed for key=${key}`,
        (error as Error).message,
      );
      return null;
    }
  }
}

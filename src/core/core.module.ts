import { Global, Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CustomLogger } from './logger.service';

@Global()
@Module({
  imports: [],
  providers: [CacheService, CustomLogger],
  exports: [CacheService, CustomLogger],
})
export class CoreModule {}

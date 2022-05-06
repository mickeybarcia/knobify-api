import { CacheModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';

import { SpotifyTokenService } from './spotify-token.service';

const TTL = 0;

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        url: configService.get('REDIS_TLS_URL'),
        ttl: TTL,
        tls:
          configService.get('NODE_ENV') !== 'dev'
            ? {
                url: configService.get('REDIS_TLS_URL'),
                rejectUnauthorized: false,
              }
            : null,
      }),
    }),
  ],
  providers: [SpotifyTokenService],
  exports: [SpotifyTokenService],
})
export class RedisModule {}

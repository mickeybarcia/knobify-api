import { CacheModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import * as Joi from 'joi';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AppExceptionsFilter } from './filters/app-exception.filter';
import { RedisModule } from './redis/redis.module';
import { SpotifyModule } from './spotify/spotify.module';

const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('dev', 'prod').default('dev'),
  PORT: Joi.number().default(3000),
  SPOTIFY_CLIENT_ID: Joi.string().required(),
  SPOTIFY_CLIENT_SECRET: Joi.string().required(),
  SPOTIFY_CALLBACK_URL: Joi.string().required(),
  KNOBIFY_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  REDIS_TLS_URL: Joi.string().required(),
});

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema }),
    SpotifyModule,
    AuthModule,
    RedisModule,
    CacheModule.register(),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AppExceptionsFilter,
    },
  ],
})
export class AppModule {}

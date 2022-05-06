import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AccessTokenStrategy } from './strategies/access-token.strategy';
import { SpotifyOauthStrategy } from './strategies/spotify-oauth.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { SpotifyModule } from 'src/spotify/spotify.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [
    PassportModule.register({ showDialog: true }),
    JwtModule.registerAsync({
      useFactory: async (config: ConfigService) => {
        return {
          secret: config.get('JWT_SECRET'),
        };
      },
      inject: [ConfigService],
    }),
    SpotifyModule,
    ConfigModule,
    RedisModule,
  ],
  providers: [
    AuthService,
    AccessTokenStrategy,
    RefreshTokenStrategy,
    SpotifyOauthStrategy,
  ],
  controllers: [AuthController],
})
export class AuthModule {}

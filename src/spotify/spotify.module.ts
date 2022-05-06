import { Module } from '@nestjs/common';
import { RedisModule } from 'src/redis/redis.module';
import { SpotifyService } from './spotify.service';
import { SpotifyController } from './spotify.controller';

@Module({
  imports: [RedisModule],
  providers: [SpotifyService],
  exports: [SpotifyService],
  controllers: [SpotifyController],
})
export class SpotifyModule {}

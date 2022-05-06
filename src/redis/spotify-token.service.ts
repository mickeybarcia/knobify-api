import { Injectable, Inject, CACHE_MANAGER } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class SpotifyTokenService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async saveAccessToken(token: string, userId: string) {
    await this.cache.set<string>(`${userId}:accessToken`, token);
  }

  async saveRefreshToken(token: string, userId: string) {
    await this.cache.set<string>(`${userId}:refreshToken`, token);
  }

  async getAccessToken(userId: string): Promise<string> {
    return await this.cache.get<string>(`${userId}:accessToken`);
  }

  async getRefreshToken(userId: string): Promise<string> {
    return await this.cache.get<string>(`${userId}:refreshToken`);
  }
}

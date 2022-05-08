import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import SpotifyWebApi from 'spotify-web-api-node';

import { SpotifyTokenService } from 'src/redis/spotify-token.service';
import { RecommendationsQueryDto } from './dto/recommendations-query.dto';

interface Response<T> {
  body: T;
  headers: Record<string, string>;
  statusCode: number;
}

@Injectable()
export class SpotifyService extends SpotifyWebApi {
  constructor(
    private readonly spotifyTokenService: SpotifyTokenService,
    configService: ConfigService,
  ) {
    super({
      clientId: configService.get('SPOTIFY_CLIENT_ID'),
      clientSecret: configService.get('SPOTIFY_CLIENT_SECRET'),
      redirectUri: configService.get('SPOTIFY_CALLBACK_URL'),
    });
    this.spotifyTokenService = spotifyTokenService;
  }

  async getRecommendationsWrapper(
    userId: string,
    recommendationOptions: RecommendationsQueryDto,
  ) {
    return this.call(userId, (api) =>
      api.getRecommendations(recommendationOptions),
    );
  }

  async getMyRecentlyPlayedTracksWrapper(userId: string, limit: number) {
    return this.call(userId, (api) => api.getMyRecentlyPlayedTracks({ limit }));
  }

  async containsMySavedTracksWrapper(userId: string, trackIds: string[]) {
    return this.call(userId, (api) => api.containsMySavedTracks(trackIds));
  }

  async searchArtistsWrapper(userId: string, query: string, limit: number) {
    return this.call(userId, (api) => api.searchArtists(query, { limit }));
  }

  async searchTracksWrapper(userId: string, query: string, limit: number) {
    return this.call(userId, (api) => api.searchTracks(query, { limit }));
  }

  async playTrackWrapper(userId: string, uris: string[]) {
    return this.call(userId, (api) =>
      api.play({ uris, offset: { position: 0 } }),
    );
  }

  async getMyDevicesWrapper(userId: string) {
    return this.call(userId, (api) => api.getMyDevices());
  }

  async transferMyPlaybackWrapper(userId: string, deviceId: string) {
    return this.call(userId, (api) => api.transferMyPlayback([deviceId]));
  }

  private async setAuth(userId: string) {
    const accessToken = await this.spotifyTokenService.getAccessToken(userId);
    this.setAccessToken(accessToken);
  }

  async saveAuth(
    userId: string,
    authInfo: { accessToken: string; refreshToken: string },
  ) {
    const { accessToken, refreshToken } = authInfo;
    await this.spotifyTokenService.saveAccessToken(accessToken, userId);
    await this.spotifyTokenService.saveRefreshToken(refreshToken, userId);
  }

  private async refreshAuth(userId: string) {
    const refreshToken = await this.spotifyTokenService.getRefreshToken(userId);
    this.setRefreshToken(refreshToken);
    try {
      const {
        body: { access_token: accessToken },
      } = await this.refreshAccessToken();
      this.setAccessToken(accessToken);
      await this.spotifyTokenService.saveAccessToken(accessToken, userId);
    } catch (err) {
      const message = 'spotify client refresh token error';
      const originalError = err.body.error;
      throw new UnauthorizedException({ message, originalError });
    }
  }

  private async call<T>(
    userId: string,
    call: (api: SpotifyWebApi) => Promise<Response<T>>,
  ): Promise<T> {
    const makeCall = async () => {
      try {
        const data = await call(this);
        return data;
      } catch (err) {
        if (err.statusCode === 401) {
          console.warn('spotify auth error: ', err);
          await this.refreshAuth(userId);
          return call(this);
        }
        const message = 'spotify client error';
        const originalError = err.body.error;
        throw new InternalServerErrorException({ message, originalError });
      }
    };
    await this.setAuth(userId);
    const { body } = await makeCall();
    return body;
  }
}

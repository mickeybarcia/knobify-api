import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import SpotifyWebApi from 'spotify-web-api-node';

import { SpotifyTokenService } from 'src/redis/spotify-token.service';
import { RecommendationsQueryDto } from './dto/recommendations-query.dto';
import { Artist, Track } from './dto/spotify.dto';

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
  ): Promise<Track[]> {
    const { tracks } = await this.call(userId, (api) =>
      api.getRecommendations(recommendationOptions),
    );
    return tracks.map((track) => this.formatSpotifyTrack(track));
  }

  async getMyRecentlyPlayedTracksWrapper(
    userId: string,
    limit: number,
  ): Promise<Track[]> {
    const { items: tracks } = await this.call(userId, (api) =>
      api.getMyRecentlyPlayedTracks({ limit }),
    );
    return tracks.map(({ track }) => this.formatSpotifyTrack(track));
  }

  async containsMySavedTracksWrapper(
    userId: string,
    trackIds: string[],
  ): Promise<boolean[]> {
    return this.call(userId, (api) => api.containsMySavedTracks(trackIds));
  }

  async searchArtistsWrapper(
    userId: string,
    query: string,
    limit: number,
  ): Promise<Artist[]> {
    const {
      artists: { items: artists },
    } = await this.call(userId, (api) => api.searchArtists(query, { limit }));
    return artists.map(this.formatSpotifyArtist);
  }

  async searchTracksWrapper(
    userId: string,
    query: string,
    limit: number,
  ): Promise<Track[]> {
    const {
      tracks: { items: tracks },
    } = await this.call(userId, (api) => api.searchTracks(query, { limit }));
    return tracks.map((track) => this.formatSpotifyTrack(track));
  }

  async playTrackWrapper(userId: string, uris: string[]): Promise<void> {
    return this.call(userId, (api) =>
      api.play({ uris, offset: { position: 0 } }),
    );
  }

  async getMyDevicesWrapper(userId: string): Promise<string[]> {
    const { devices } = await this.call(userId, (api) => api.getMyDevices());
    return devices.map(({ id }) => id);
  }

  async transferMyPlaybackWrapper(
    userId: string,
    deviceId: string,
  ): Promise<void> {
    return this.call(userId, (api) => api.transferMyPlayback([deviceId]));
  }

  private async setAuth(userId: string) {
    const accessToken = await this.spotifyTokenService.getAccessToken(userId);
    this.setAccessToken(accessToken);
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

  private formatSpotifyArtist(artist): Artist {
    const {
      id,
      name,
      uri: playUri,
      external_urls: { spotify: appUrl },
    } = artist;
    return {
      id,
      name,
      playUri,
      appUrl,
    };
  }

  private formatSpotifyTrack(track): Track {
    const {
      id,
      name,
      artists,
      external_urls: { spotify: appUrl },
      is_playable: isPlayable,
      album: { images },
      uri: playUri,
    } = track;
    return {
      id,
      name,
      artists: artists.map(this.formatSpotifyArtist),
      appUrl,
      isPlayable,
      picUrl: images.length > 0 ? images[0].url : '',
      playUri,
    };
  }
}

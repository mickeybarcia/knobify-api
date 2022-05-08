import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { ReqUser } from 'src/auth/decorators/user.decorator';
import { AccessTokenAuthGuard } from 'src/auth/guards/access-token.guard';
import { RecommendationsQueryDto } from './dto/recommendations-query.dto';
import {
  Artist,
  Track,
  RecommendationsResponseDto,
  SearchArtistResponseDto,
  SearchTracksResponseDto,
} from './dto/response.dto';
import { SpotifyService } from './spotify.service';

const RECOMMENDATIONS_LIMIT = 20;
const RECENTLY_PLAYED_LIMIT = 50;
const SEARCH_LIMIT = 5;

@UseGuards(AccessTokenAuthGuard)
@Controller('spotify')
export class SpotifyController {
  constructor(private readonly spotifyService: SpotifyService) {}

  @Post('recommendations')
  async getRecommendations(
    @ReqUser('userId') userId: string,
    @Body() recommendationsQuery: RecommendationsQueryDto,
  ): Promise<RecommendationsResponseDto> {
    let tracks;
    recommendationsQuery.limit = RECOMMENDATIONS_LIMIT;
    const { tracks: spotifyServiceTracks } =
      await this.spotifyService.getRecommendationsWrapper(
        userId,
        recommendationsQuery,
      );
    tracks = spotifyServiceTracks;
    if (recommendationsQuery.excludeLiked) {
      const filteredTracks: boolean[] =
        await this.spotifyService.containsMySavedTracksWrapper(
          userId,
          tracks.map(({ id }) => id),
        );
      // grab tracks that are false for being in liked songs as per the array index
      tracks = tracks.filter((_, index) => !filteredTracks[index]);
    }
    if (recommendationsQuery.excludeRecent) {
      const { items: recentTracks } =
        await this.spotifyService.getMyRecentlyPlayedTracksWrapper(
          userId,
          RECENTLY_PLAYED_LIMIT,
        );
      const recentTrackIds = recentTracks.map(({ track: { id } }) => id);
      tracks = tracks.filter(({ id }) => !recentTrackIds.includes(id));
    }
    return this.formatGetRecommendationsResponse(tracks);
  }

  @Get('searchArtists')
  async searchArtists(
    @Query('query') query,
    @ReqUser('userId') userId: string,
  ): Promise<SearchArtistResponseDto> {
    const {
      artists: { items: artists },
    } = await this.spotifyService.searchArtistsWrapper(
      userId,
      query,
      SEARCH_LIMIT,
    );
    return this.formatSearchArtistsResponse(artists);
  }

  @Get('searchTracks')
  async searchTracks(
    @Query('query') query,
    @ReqUser('userId') userId: string,
  ): Promise<SearchTracksResponseDto> {
    const {
      tracks: { items: tracks },
    } = await this.spotifyService.searchTracksWrapper(
      userId,
      query,
      SEARCH_LIMIT,
    );
    return this.formatSearchTracksResponse(tracks);
  }

  @Get('playTracks')
  async playTracks(
    @Query('uris') uris,
    @ReqUser('userId') userId: string,
  ): Promise<void> {
    const playTracks = async () => {
      await this.spotifyService.playTrackWrapper(userId, uris.split(','));
    };
    try {
      await playTracks();
    } catch (error) {
      // awake an inactive device if possible
      const { devices } = await this.spotifyService.getMyDevicesWrapper(userId);
      if (devices.length > 0) {
        const { id: defaultDeviceId } = devices[0];
        await this.spotifyService.transferMyPlaybackWrapper(
          userId,
          defaultDeviceId,
        );
        return await playTracks();
      }
      throw error;
    }
  }

  // TODO - refactor

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

  private formatGetRecommendationsResponse(
    spotifyServiceTracks,
  ): RecommendationsResponseDto {
    const tracks = spotifyServiceTracks.map((track) =>
      this.formatSpotifyTrack(track),
    );
    return { tracks };
  }

  private formatSearchArtistsResponse(
    spotifyServiceArtists,
  ): SearchArtistResponseDto {
    const artists = spotifyServiceArtists.map(this.formatSpotifyArtist);
    return { artists };
  }

  private formatSearchTracksResponse(
    spotifyServiceTracks,
  ): SearchTracksResponseDto {
    const tracks = spotifyServiceTracks.map((track) =>
      this.formatSpotifyTrack(track),
    );
    return { tracks };
  }
}

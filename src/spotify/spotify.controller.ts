import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { ReqUser } from 'src/auth/decorators/user.decorator';
import { AccessTokenAuthGuard } from 'src/auth/guards/access-token.guard';
import { RecommendationsQueryDto } from './dto/recommendations-query.dto';
import { Track, Artist } from './dto/spotify.dto';
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
  ): Promise<{ tracks: Track[] }> {
    recommendationsQuery.limit = RECOMMENDATIONS_LIMIT;
    let tracks = await this.spotifyService.getRecommendationsWrapper(
      userId,
      recommendationsQuery,
    );
    if (recommendationsQuery.excludeLiked) {
      tracks = await this.filterLikedSongs(userId, tracks);
    }
    if (recommendationsQuery.excludeRecent) {
      tracks = await this.filterRecentSongs(userId, tracks);
    }
    return { tracks };
  }

  @Get('searchArtists')
  async searchArtists(
    @Query('query') query,
    @ReqUser('userId') userId: string,
  ): Promise<{ artists: Artist[] }> {
    const artists = await this.spotifyService.searchArtistsWrapper(
      userId,
      query,
      SEARCH_LIMIT,
    );
    return { artists };
  }

  @Get('currentPlayingSong')
  async currentPlayingSong(
    @ReqUser('userId') userId: string,
  ): Promise<{ track: Track }> {
    const track = await this.spotifyService.getCurrentSongWrapper(userId);
    return { track };
  }

  @Get('searchTracks')
  async searchTracks(
    @Query('query') query,
    @ReqUser('userId') userId: string,
  ): Promise<{ tracks: Track[] }> {
    const tracks = await this.spotifyService.searchTracksWrapper(
      userId,
      query,
      SEARCH_LIMIT,
    );
    return { tracks };
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
      const devices = await this.spotifyService.getMyDevicesWrapper(userId);
      if (devices.length > 0) {
        await this.spotifyService.transferMyPlaybackWrapper(userId, devices[0]);
        return await playTracks();
      }
      throw error;
    }
  }

  private async filterRecentSongs(userId: string, tracks: Track[]) {
    const recentTracks =
      await this.spotifyService.getMyRecentlyPlayedTracksWrapper(
        userId,
        RECENTLY_PLAYED_LIMIT,
      );
    const recentTrackIds = recentTracks.map(({ id }) => id);
    tracks = tracks.filter(({ id }) => !recentTrackIds.includes(id));
    return tracks;
  }

  private async filterLikedSongs(userId: string, tracks: Track[]) {
    const filteredTracks: boolean[] =
      await this.spotifyService.containsMySavedTracksWrapper(
        userId,
        tracks.map(({ id }) => id),
      );
    // grab tracks that are false for being in liked songs as per the array index
    tracks = tracks.filter((_, index) => !filteredTracks[index]);
    return tracks;
  }
}

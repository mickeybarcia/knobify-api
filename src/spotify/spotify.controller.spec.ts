import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { RedisModule } from 'src/redis/redis.module';
import { RecommendationsQueryDto } from './dto/recommendations-query.dto';
import { Artist, Track } from './dto/spotify.dto';
import { SpotifyController } from './spotify.controller';
import { SpotifyService } from './spotify.service';

const USER_ID = 'mbdarbin';

const mockArtist: Artist = {
  id: 'abc',
  name: 'trippie redd',
  playUri: 'spotify:abc',
  appUrl: 'spotify.com/abc',
};

const mockTrack: Track = {
  artists: [mockArtist],
  id: 'abc',
  name: 'miss the rage',
  playUri: 'spotify:abc',
  appUrl: 'spotify.com/abc',
  picUrl: 'spotify/abc.png',
  isPlayable: true,
};

const mockRecommendationsQuery: RecommendationsQueryDto = {
  seed_artists: ['abc'],
  min_energy: 0,
};

describe('SpotifyController', () => {
  let controller: SpotifyController;
  let spotifyService: SpotifyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [RedisModule, ConfigModule],
      controllers: [SpotifyController],
      providers: [SpotifyService],
    }).compile();

    controller = module.get<SpotifyController>(SpotifyController);
    spotifyService = module.get<SpotifyService>(SpotifyService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('get /searchArtists', () => {
    it('gets artist search results', async () => {
      jest
        .spyOn(spotifyService, 'searchArtistsWrapper')
        .mockResolvedValue([mockArtist]);
      const res = await controller.searchArtists('trippie', USER_ID);
      expect(res).toEqual({ artists: [mockArtist] });
    });
  });

  describe('get /searchTracks', () => {
    it('gets track search results', async () => {
      jest
        .spyOn(spotifyService, 'searchTracksWrapper')
        .mockResolvedValue([mockTrack]);
      const res = await controller.searchTracks('miss', USER_ID);
      expect(res).toEqual({ tracks: [mockTrack] });
    });
  });

  describe('post /recommendations', () => {
    it('gets recommendation results', async () => {
      jest
        .spyOn(spotifyService, 'getRecommendationsWrapper')
        .mockResolvedValue([mockTrack]);
      const res = await controller.getRecommendations(
        USER_ID,
        mockRecommendationsQuery,
      );
      expect(res).toEqual({ tracks: [mockTrack] });
    });

    it('filters liked songs', async () => {
      const mockLikedTrack = { ...mockTrack, id: '123' };
      jest
        .spyOn(spotifyService, 'getRecommendationsWrapper')
        .mockResolvedValue([mockTrack, mockLikedTrack]);
      jest
        .spyOn(spotifyService, 'containsMySavedTracksWrapper')
        .mockResolvedValue([false, true]);
      const res = await controller.getRecommendations(USER_ID, {
        ...mockRecommendationsQuery,
        excludeLiked: true,
      });
      expect(res).toEqual({ tracks: [mockTrack] });
    });

    it('filters recent songs', async () => {
      const mockRecentTrack = { ...mockTrack, id: '123' };
      jest
        .spyOn(spotifyService, 'getRecommendationsWrapper')
        .mockResolvedValue([mockTrack, mockRecentTrack]);
      jest
        .spyOn(spotifyService, 'getMyRecentlyPlayedTracksWrapper')
        .mockResolvedValue([mockRecentTrack]);
      const res = await controller.getRecommendations(USER_ID, {
        ...mockRecommendationsQuery,
        excludeRecent: true,
      });
      expect(res).toEqual({ tracks: [mockTrack] });
    });
  });

  describe('get /playTracks', () => {
    it('plays tracks', async () => {
      jest
        .spyOn(spotifyService, 'playTrackWrapper')
        .mockImplementation(() => null);
      await controller.playTracks('spotify:abc', USER_ID);
    });

    it('awakes an inactive device to play', async () => {
      jest
        .spyOn(spotifyService, 'playTrackWrapper')
        .mockImplementationOnce(() => {
          throw Error();
        });
      jest
        .spyOn(spotifyService, 'getMyDevicesWrapper')
        .mockResolvedValue(['abc']);
      jest
        .spyOn(spotifyService, 'transferMyPlaybackWrapper')
        .mockImplementation(() => null);
      jest
        .spyOn(spotifyService, 'playTrackWrapper')
        .mockImplementationOnce(() => null);
      await controller.playTracks('spotify:abc', USER_ID);
      expect(spotifyService.getMyDevicesWrapper).toHaveBeenCalled();
    });
  });
});

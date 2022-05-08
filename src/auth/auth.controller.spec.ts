import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';

import { SpotifyTokenService } from 'src/redis/spotify-token.service';
import { RedisModule } from 'src/redis/redis.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { STATE_COOKIE } from './constants/auth.constants';

const USER_ID = 'mbdarbin';
const TOKEN = 'token';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let spotifyTokenService: SpotifyTokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [RedisModule, ConfigModule],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            createRefreshToken: jest.fn(),
            createAccessToken: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    spotifyTokenService = module.get<SpotifyTokenService>(SpotifyTokenService);
    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('get /refreshToken', () => {
    it('should generate an access token', async () => {
      jest
        .spyOn(authService, 'createAccessToken')
        .mockImplementation(() => TOKEN);
      const res = await controller.refreshAccessToken(USER_ID);
      expect(res).toEqual({ token: TOKEN });
    });
  });

  describe('get /redirect', () => {
    const response = {
      cookie: jest.fn(),
      redirect: jest.fn(),
    };

    it('save auth and redirect user to app', async () => {
      const request = {
        cookies: { [STATE_COOKIE]: 'state' },
        user: {
          id: USER_ID,
        },
        authInfo: {
          accessToken: 'abc',
          refreshToken: 'abc',
        },
      };
      jest
        .spyOn(spotifyTokenService, 'saveAccessToken')
        .mockImplementation(() => null);
      jest
        .spyOn(spotifyTokenService, 'saveRefreshToken')
        .mockImplementation(() => null);
      jest
        .spyOn(authService, 'createRefreshToken')
        .mockImplementation(() => TOKEN);
      await controller.spotifyAuthRedirect(request, response, 'state');
      expect(response.cookie).toHaveBeenCalled();
      expect(response.redirect).toHaveBeenCalled();
    });

    it('redirect if spotify auth failed', async () => {
      const request = {
        cookies: { [STATE_COOKIE]: 'state' },
      };
      await controller.spotifyAuthRedirect(request, response, 'state');
      expect(authService.createRefreshToken).toHaveBeenCalledTimes(0);
      expect(response.cookie).toHaveBeenCalled();
      expect(response.redirect).toHaveBeenCalled();
    });
  });
});

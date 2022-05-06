import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { SpotifyTokenService } from 'src/redis/spotify-token.service';
import { JwtPayload, User } from '../dto/auth.dto';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
  Strategy,
  'access_token',
) {
  constructor(
    protected configService: ConfigService,
    private readonly spotifyTokenService: SpotifyTokenService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
    this.spotifyTokenService = spotifyTokenService;
  }

  async validate(payload: JwtPayload): Promise<User> {
    const { sub: userId } = payload;
    const token = await this.spotifyTokenService.getAccessToken(userId);
    if (!token) {
      throw new UnauthorizedException(
        'No Spotify access token saved for this user',
      );
    }
    return { userId };
  }
}

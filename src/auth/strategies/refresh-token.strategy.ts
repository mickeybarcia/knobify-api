import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { JwtFromRequestFunction, Strategy } from 'passport-jwt';

import { SpotifyTokenService } from 'src/redis/spotify-token.service';
import { REFRESH_TOKEN_COOKIE } from '../constants/auth.constants';
import { JwtPayload, User } from '../dto/auth.dto';

const extractJwtFromCookie: JwtFromRequestFunction = (req) => {
  const token = req.cookies[REFRESH_TOKEN_COOKIE] || null;
  return token;
};

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'refresh_token',
) {
  constructor(
    protected configService: ConfigService,
    private readonly spotifyTokenService: SpotifyTokenService,
  ) {
    super({
      jwtFromRequest: extractJwtFromCookie,
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
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

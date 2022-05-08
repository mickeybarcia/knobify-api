import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-spotify';

const scope =
  'user-library-read streaming user-top-read user-read-playback-state user-read-recently-played';

@Injectable()
export class SpotifyOauthStrategy extends PassportStrategy(
  Strategy,
  'spotify',
) {
  constructor(protected configService: ConfigService) {
    super(
      {
        clientID: configService.get('SPOTIFY_CLIENT_ID'),
        clientSecret: configService.get('SPOTIFY_CLIENT_SECRET'),
        callbackURL: configService.get('SPOTIFY_CALLBACK_URL'),
        scope,
      },
      (
        accessToken: string,
        refreshToken: string,
        expires_in: number,
        profile: Profile,
        done: VerifyCallback,
      ): void => {
        return done(null, profile, { accessToken, refreshToken, expires_in });
      },
    );
  }

  authenticate(req, options) {
    super.authenticate(
      req,
      Object.assign(options, {
        state: req.query.state,
      }),
    );
  }
}

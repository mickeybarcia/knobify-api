import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';

import { AuthService } from './auth.service';
import { SpotifyOauthGuard } from './guards/spotify-oauth.guard';
import { SpotifyService } from 'src/spotify/spotify.service';
import { RefreshTokenAuthGuard } from './guards/refresh-token.guard';
import { ReqUser } from './decorators/user.decorator';
import { ConfigService } from '@nestjs/config';
import { REFRESH_TOKEN_COOKIE, STATE_COOKIE } from './constants/auth.constants';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly spotifyService: SpotifyService,
    private readonly configService: ConfigService,
  ) {}

  @UseGuards(SpotifyOauthGuard)
  @Get('login')
  login(): void {
    return;
  }

  @UseGuards(SpotifyOauthGuard)
  @Get('redirect')
  async spotifyAuthRedirect(
    @Req() req,
    @Query('state') state: string,
    @Res() res: Response,
  ): Promise<Response> {
    const { user, authInfo } = req;
    const cookieState = req.cookies[STATE_COOKIE] || null;
    if (cookieState !== state || !user) {
      const errorUrl =
        this.configService.get('KNOBIFY_URL') + '/login?error=true';
      res.redirect(errorUrl);
      return;
    }
    const { id: userId } = user;
    this.spotifyService.saveAuth(userId, authInfo);
    req.user = undefined;
    const refreshToken = this.authService.createRefreshToken(userId);
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') !== 'dev',
    });
    res.redirect(this.configService.get('KNOBIFY_URL'));
  }

  @Get('refreshToken')
  @UseGuards(RefreshTokenAuthGuard)
  async refreshAccessToken(
    @ReqUser('userId') userId: string,
    @Res() res: Response,
  ): Promise<Response> {
    const token = this.authService.createAccessToken(userId);
    return res.send({ token });
  }
}

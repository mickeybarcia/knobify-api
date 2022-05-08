import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { SpotifyOauthGuard } from './guards/spotify-oauth.guard';
import { RefreshTokenAuthGuard } from './guards/refresh-token.guard';
import { ReqUser } from './decorators/user.decorator';
import { REFRESH_TOKEN_COOKIE, STATE_COOKIE } from './constants/auth.constants';
import { SpotifyTokenService } from 'src/redis/spotify-token.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly spotifyTokenService: SpotifyTokenService,
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
    @Res() res,
    @Query('state') state: string,
  ) {
    // first validate spotify auth
    const { user, authInfo } = req;
    const cookieState = req.cookies[STATE_COOKIE] || null;
    if (cookieState !== state || !user) {
      const errorUrl =
        this.configService.get('KNOBIFY_URL') + '/login?error=true';
      res.redirect(errorUrl);
      return;
    }

    // then save spotify auth
    const { id: userId } = user;
    const { accessToken, refreshToken: spotifyRefreshToken } = authInfo;
    await this.spotifyTokenService.saveAccessToken(accessToken, userId);
    await this.spotifyTokenService.saveRefreshToken(
      spotifyRefreshToken,
      userId,
    );

    // then save backend auth
    req.user = undefined;
    const refreshToken = this.authService.createRefreshToken(userId);
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') !== 'dev',
      sameSite: 'none',
    });

    // redirect to frontend
    res.redirect(this.configService.get('KNOBIFY_URL'));
  }

  @Get('refreshToken')
  @UseGuards(RefreshTokenAuthGuard)
  async refreshAccessToken(
    @ReqUser('userId') userId: string,
  ): Promise<{ token: string }> {
    const token = this.authService.createAccessToken(userId);
    return { token };
  }
}

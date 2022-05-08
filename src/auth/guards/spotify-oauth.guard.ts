import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { STATE_COOKIE } from '../constants/auth.constants';

@Injectable()
export class SpotifyOauthGuard extends AuthGuard('spotify') {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const res = ctx.switchToHttp().getResponse();
    res.cookie(STATE_COOKIE, req.query.state, {
      // will verify cookie when spotify hits /auth/redirect
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'dev',
    });
    return super.canActivate(ctx);
  }
}

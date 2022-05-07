import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { STATE_COOKIE } from '../constants/auth.constants';

@Injectable()
export class SpotifyOauthGuard extends AuthGuard('spotify') {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const res = ctx.switchToHttp().getResponse();
    console.log('secure ' + process.env.NODE_ENV !== 'dev')
    res.cookie(STATE_COOKIE, req.query.state, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'dev',
      sameSite: 'none',
    });
    return super.canActivate(ctx);
  }
}

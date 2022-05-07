import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AccessTokenAuthGuard extends AuthGuard('access_token') {
  // use access_token strategy
  canActivate(ctx: ExecutionContext) {
    const headers = ctx.switchToHttp().getRequest().headers.authorization;
    if (process.env.NODE_ENV === 'dev' && !headers) {
      // ie not using frontend, skip token check
      return true;
    }
    return super.canActivate(ctx);
  }
}

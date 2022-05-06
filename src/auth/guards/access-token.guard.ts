import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AccessTokenAuthGuard extends AuthGuard('access_token') {
  canActivate(ctx: ExecutionContext) {
    const headers = ctx.switchToHttp().getRequest().headers.authorization;
    if (process.env.NODE_ENV === 'dev' && !headers) {
      return true;
    }
    return super.canActivate(ctx);
  }
}

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

const TEST_USER = 'mbdarbin'; // me

export const ReqUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    if (process.env.NODE_ENV === 'dev') return TEST_USER;
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

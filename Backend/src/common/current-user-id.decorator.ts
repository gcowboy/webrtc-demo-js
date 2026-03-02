import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CLERK_USER_ID_KEY } from './clerk-auth.guard';

export const CurrentUserId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request[CLERK_USER_ID_KEY] ?? '';
  },
);

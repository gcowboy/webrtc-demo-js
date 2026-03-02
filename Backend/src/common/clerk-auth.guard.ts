import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

export const CLERK_USER_ID_KEY = 'userId';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : (request.cookies?.__session as string | undefined);

    if (!token) {
      throw new UnauthorizedException('Token not found. User must sign in.');
    }

    const secretKey = this.config.get<string>('CLERK_SECRET_KEY');
    if (!secretKey) {
      throw new UnauthorizedException('Clerk not configured');
    }

    try {
      const result = await verifyToken(token, { secretKey });
      const sub = (result as { data?: { sub?: string } })?.data?.sub;
      if (!sub) throw new Error('No sub in token');
      (request as Request & { [CLERK_USER_ID_KEY]: string })[CLERK_USER_ID_KEY] = sub;
      return true;
    } catch {
      throw new UnauthorizedException('Token not verified.');
    }
  }
}

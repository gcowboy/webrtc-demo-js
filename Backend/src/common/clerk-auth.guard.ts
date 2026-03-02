import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

export const CLERK_USER_ID_KEY = 'userId';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);

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

    // Token's azp claim is the frontend origin; must allow it or verification fails
    const authorizedPartiesRaw = this.config.get<string>('CLERK_AUTHORIZED_PARTIES');
    const authorizedParties = authorizedPartiesRaw
      ? authorizedPartiesRaw.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    try {
      const payload = await verifyToken(token, {
        secretKey,
        ...(authorizedParties?.length ? { authorizedParties } : {}),
      });
      // verifyToken returns the JWT payload directly (sub, azp, exp, etc.)
      const sub = (payload as { sub?: string })?.sub;
      if (!sub) {
        this.logger.warn('Token verified but missing sub claim');
        throw new UnauthorizedException('Token not verified.');
      }
      (request as Request & { [CLERK_USER_ID_KEY]: string })[CLERK_USER_ID_KEY] = sub;
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Clerk verifyToken failed: ${message}`);
      throw new UnauthorizedException('Token not verified.');
    }
  }
}

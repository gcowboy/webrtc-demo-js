import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';

export const ADMIN_EMAIL_REQUEST_KEY = 'adminEmail';

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function signPayload(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function verifySignature(secret: string, payload: string, signature: string): boolean {
  const expected = signPayload(secret, payload);
  if (expected.length !== signature.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(signature, 'utf8'));
  } catch {
    return false;
  }
}

@Injectable()
export class AdminEnvAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      throw new UnauthorizedException('Admin token required.');
    }

    const secret = this.config.get<string>('ADMIN_JWT_SECRET');
    if (!secret) {
      throw new UnauthorizedException('Admin auth not configured.');
    }

    const dot = token.indexOf('.');
    if (dot === -1) {
      throw new UnauthorizedException('Invalid admin token.');
    }
    const payloadB64 = token.slice(0, dot);
    const signature = token.slice(dot + 1);
    let payloadJson: string;
    try {
      payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
    } catch {
      throw new UnauthorizedException('Invalid admin token.');
    }
    if (!verifySignature(secret, payloadJson, signature)) {
      throw new UnauthorizedException('Invalid admin token.');
    }
    let payload: { sub?: string; exp?: number };
    try {
      payload = JSON.parse(payloadJson) as { sub?: string; exp?: number };
    } catch {
      throw new UnauthorizedException('Invalid admin token.');
    }
    if (!payload.sub || typeof payload.exp !== 'number' || payload.exp < Date.now()) {
      throw new UnauthorizedException('Invalid or expired admin token.');
    }

    const adminEmail = this.config.get<string>('ADMIN_EMAIL');
    if (payload.sub !== adminEmail) {
      throw new UnauthorizedException('Invalid admin token.');
    }

    (request as Request & { [ADMIN_EMAIL_REQUEST_KEY]: string })[ADMIN_EMAIL_REQUEST_KEY] =
      payload.sub;
    return true;
  }
}

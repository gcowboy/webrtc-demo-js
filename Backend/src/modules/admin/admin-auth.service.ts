import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

@Injectable()
export class AdminAuthService {
  constructor(private readonly config: ConfigService) {}

  login(email: string, password: string): { token: string } {
    const adminEmail = this.config.get<string>('ADMIN_EMAIL');
    const adminPassword = this.config.get<string>('ADMIN_PASSWORD');
    const secret = this.config.get<string>('ADMIN_JWT_SECRET');

    if (!adminEmail || !adminPassword || !secret) {
      throw new UnauthorizedException('Admin auth not configured.');
    }
    if (email !== adminEmail || password !== adminPassword) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const payload = {
      sub: adminEmail,
      exp: Date.now() + TOKEN_TTL_MS,
    };
    const payloadJson = JSON.stringify(payload);
    const payloadB64 = Buffer.from(payloadJson, 'utf8').toString('base64url');
    const signature = createHmac('sha256', secret).update(payloadJson).digest('base64url');
    const token = `${payloadB64}.${signature}`;
    return { token };
  }
}
